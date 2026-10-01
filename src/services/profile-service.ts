import { loginKey } from '../domain/login.js';
import { deriveSnapshot, SNAPSHOT_VERSION, type ProfileSnapshot } from '../domain/snapshot.js';
import type { ProfileCollector } from '../github/collector.js';
import { GithubError } from '../github/errors.js';
import type { QuotaTracker } from '../github/quota.js';
import type { Logger } from '../lib/logger.js';
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
}

const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000;

/**
 * Serve snapshots com stale-while-revalidate e garante uma coleta por login por vez (§3, §8).
 * @example const lookup = await service.getProfile('torvalds');
 */
export class ProfileService {
  private readonly inFlight = new Map<string, Promise<ProfileSnapshot | null>>();

  constructor(private readonly deps: ProfileServiceDeps) {}

  async getProfile(login: string): Promise<ProfileLookup> {
    const stored = this.deps.store.find(login);
    if (stored && this.isFresh(stored.snapshot, stored.expiresAt)) {
      return { status: 'ok', snapshot: stored.snapshot, stale: false };
    }
    if (stored) {
      if (!this.deps.quota.isLow()) this.refreshInBackground(login);
      return { status: 'ok', snapshot: stored.snapshot, stale: true };
    }
    return this.collectNow(login);
  }

  /** Snapshot salvo, sem disparar coleta: usado por badge e card. */
  findStored(login: string): ProfileSnapshot | null {
    return this.deps.store.find(login)?.snapshot ?? null;
  }

  /** Coleta em andamento para o login, se houver. */
  isCollecting(login: string): boolean {
    return this.inFlight.has(loginKey(login));
  }

  private async collectNow(login: string): Promise<ProfileLookup> {
    if (this.deps.quota.isLow()) {
      return { status: 'unavailable', reason: 'cota baixa', resetAt: this.quotaReset() };
    }
    try {
      const snapshot = await this.refresh(login);
      return snapshot ? { status: 'ok', snapshot, stale: false } : { status: 'not_found' };
    } catch (error) {
      return toUnavailable(error);
    }
  }

  private refreshInBackground(login: string): void {
    this.refresh(login).catch((error: unknown) => {
      this.deps.logger.log('warn', 'collection.background_failed', { login, error: String(error) });
    });
  }

  /** Deduplica por login: chamadas simultâneas compartilham a mesma promessa. */
  private refresh(login: string): Promise<ProfileSnapshot | null> {
    const key = loginKey(login);
    const running = this.inFlight.get(key);
    if (running) return running;
    const task = this.runCollection(login).finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, task);
    return task;
  }

  private async runCollection(login: string): Promise<ProfileSnapshot | null> {
    const started = Date.now();
    const { collector, progress } = this.deps;
    try {
      const collected = await collector.collect(login, (step) =>
        progress.publish(login, { type: 'progress', ...step }),
      );
      if (!collected) return this.finishNotFound(login);
      progress.publish(login, {
        type: 'progress',
        stage: 'conquistas',
        account: collected.account,
      });
      const snapshot = deriveSnapshot(collected, this.deps.now());
      this.save(snapshot);
      this.deps.logger.log('info', 'collection.done', {
        login,
        ms: Date.now() - started,
        repos: collected.repos.length,
      });
      progress.publish(login, { type: 'done' });
      return snapshot;
    } catch (error) {
      progress.publish(login, { type: 'failed', reason: String(error) });
      this.deps.logger.log('error', 'collection.failed', {
        login,
        ms: Date.now() - started,
        error: String(error),
      });
      throw error;
    }
  }

  private finishNotFound(login: string): null {
    this.deps.progress.publish(login, { type: 'not_found' });
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
