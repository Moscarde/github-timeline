import { usernameKey } from '../domain/username.js';
import { deriveSnapshot, SNAPSHOT_VERSION, type ProfileSnapshot } from '../domain/snapshot.js';
import type { ProfileCollector } from '../github/collector.js';
import { GithubError } from '../github/errors.js';
import type { QuotaTracker } from '../github/quota.js';
import type { Logger } from '../lib/logger.js';
import { Semaphore } from '../lib/semaphore.js';
import type { SnapshotStore } from '../storage/snapshot-store.js';
import type { ProgressHub } from './progress-hub.js';

export type ProfileLookup =
  | { status: 'ok'; snapshot: ProfileSnapshot; stale: boolean }
  | { status: 'not_found' }
  | { status: 'unavailable'; reason: string; resetAt: Date | null };

export interface ProfileServiceDeps {
  collector: ProfileCollector;
  store: SnapshotStore;
  quota: QuotaTracker;
  progress: ProgressHub;
  logger: Logger;
  now: () => Date;
  ttlMs?: number;
  /** Coletas simultâneas entre todos os usernames; as demais esperam a vez (§8). */
  maxConcurrentCollections?: number;
}

const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000;
const DEFAULT_CONCURRENT_COLLECTIONS = 3;

/**
 * Serve snapshots com stale-while-revalidate e garante uma coleta por username por vez (§3, §8).
 * @example const lookup = await service.getProfile('torvalds');
 */
export class ProfileService {
  private readonly inFlight = new Map<string, Promise<ProfileSnapshot | null>>();

  /**
   * Cada coleta já abre até 10 requisições paralelas; sem um teto global, muitos perfis novos
   * ao mesmo tempo acionam o limite secundário do GitHub antes de a cota baixar.
   */
  private readonly slots: Semaphore;

  constructor(private readonly deps: ProfileServiceDeps) {
    this.slots = new Semaphore(deps.maxConcurrentCollections ?? DEFAULT_CONCURRENT_COLLECTIONS);
  }

  async getProfile(username: string): Promise<ProfileLookup> {
    const stored = this.deps.store.find(username);
    if (stored && this.isFresh(stored.snapshot, stored.expiresAt)) {
      return { status: 'ok', snapshot: stored.snapshot, stale: false };
    }
    if (stored) {
      if (!this.deps.quota.isLow()) this.refreshInBackground(username);
      return { status: 'ok', snapshot: stored.snapshot, stale: true };
    }
    return this.collectNow(username);
  }

  /** Snapshot salvo, sem disparar coleta: usado por badge e card. */
  findStored(username: string): ProfileSnapshot | null {
    return this.deps.store.find(username)?.snapshot ?? null;
  }

  /** Coleta em andamento para o username, se houver. */
  isCollecting(username: string): boolean {
    return this.inFlight.has(usernameKey(username));
  }

  private async collectNow(username: string): Promise<ProfileLookup> {
    if (this.deps.quota.isLow()) {
      return { status: 'unavailable', reason: 'cota baixa', resetAt: this.quotaReset() };
    }
    try {
      const snapshot = await this.refresh(username);
      return snapshot ? { status: 'ok', snapshot, stale: false } : { status: 'not_found' };
    } catch (error) {
      return toUnavailable(error);
    }
  }

  private refreshInBackground(username: string): void {
    this.refresh(username).catch((error: unknown) => {
      this.deps.logger.log('warn', 'collection.background_failed', {
        username,
        error: String(error),
      });
    });
  }

  /** Deduplica por username: chamadas simultâneas compartilham a mesma promessa. */
  private refresh(username: string): Promise<ProfileSnapshot | null> {
    const key = usernameKey(username);
    const running = this.inFlight.get(key);
    if (running) return running;
    if (this.slots.isFull) {
      this.deps.logger.log('info', 'collection.queued', {
        username,
        waiting: this.slots.waiting + 1,
      });
    }
    const task = this.slots
      .run(() => this.runCollection(username))
      .finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, task);
    return task;
  }

  private async runCollection(username: string): Promise<ProfileSnapshot | null> {
    const started = Date.now();
    const { collector, progress } = this.deps;
    try {
      const collected = await collector.collect(username, (step) =>
        progress.publish(username, { type: 'progress', ...step }),
      );
      if (!collected) return this.finishNotFound(username);
      progress.publish(username, {
        type: 'progress',
        stage: 'conquistas',
        account: collected.account,
      });
      const snapshot = deriveSnapshot(collected, this.deps.now());
      this.save(snapshot);
      this.deps.logger.log('info', 'collection.done', {
        username,
        ms: Date.now() - started,
        repos: collected.repos.length,
      });
      progress.publish(username, { type: 'done' });
      return snapshot;
    } catch (error) {
      progress.publish(username, { type: 'failed', reason: String(error) });
      this.deps.logger.log('error', 'collection.failed', {
        username,
        ms: Date.now() - started,
        error: String(error),
      });
      throw error;
    }
  }

  private finishNotFound(username: string): null {
    this.deps.progress.publish(username, { type: 'not_found' });
    return null;
  }

  private save(snapshot: ProfileSnapshot): void {
    const ttl = this.deps.ttlMs ?? DEFAULT_TTL_MS;
    this.deps.store.save(snapshot, new Date(this.deps.now().getTime() + ttl));
  }

  private isFresh(snapshot: ProfileSnapshot, expiresAt: Date): boolean {
    return snapshot.version === SNAPSHOT_VERSION && expiresAt > this.deps.now();
  }

  private quotaReset(): Date | null {
    const reading = this.deps.quota.current();
    return reading ? new Date(reading.resetAt) : null;
  }
}

function toUnavailable(error: unknown): ProfileLookup {
  if (error instanceof GithubError) {
    return { status: 'unavailable', reason: error.kind, resetAt: error.resetAt };
  }
  throw error;
}
