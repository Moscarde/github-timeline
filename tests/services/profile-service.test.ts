import { describe, expect, it } from 'vitest';
import { deriveSnapshot } from '../../src/domain/snapshot.js';
import type { CollectedProfile } from '../../src/domain/types.js';
import { GithubError } from '../../src/github/errors.js';
import { QuotaTracker } from '../../src/github/quota.js';
import { ProfileService } from '../../src/services/profile-service.js';
import { ProgressHub, type ProgressEvent } from '../../src/services/progress-hub.js';
import { InMemorySnapshotStore } from '../fakes/in-memory-snapshot-store.js';
import { MemoryLogger } from '../fakes/memory-logger.js';
import { makeAccount, repoIn } from '../fakes/repo-factory.js';
import { ScriptedCollector } from '../fakes/scripted-collector.js';

const NOW = new Date('2026-09-30T12:00:00Z');

function collectedFor(login: string): CollectedProfile {
  return {
    account: makeAccount({ login }),
    repos: [repoIn(2020, { language: 'Go' })],
    months: {},
    orgContributions: [],
  };
}

function setup() {
  const collector = new ScriptedCollector();
  const store = new InMemorySnapshotStore();
  const quota = new QuotaTracker();
  const progress = new ProgressHub();
  const logger = new MemoryLogger();
  const service = new ProfileService({ collector, store, quota, progress, logger, now: () => NOW });
  return { collector, store, quota, progress, logger, service };
}

describe('ProfileService', () => {
  it('coleta perfil novo, salva com TTL de 12 h e publica progresso', async () => {
    const { collector, store, progress, service } = setup();
    collector.profiles.set('dev', collectedFor('dev'));
    const events: ProgressEvent['type'][] = [];
    progress.subscribe('DEV', (event) => events.push(event.type));

    const lookup = await service.getProfile('dev');

    expect(lookup).toMatchObject({ status: 'ok', stale: false });
    expect(store.find('dev')?.expiresAt.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(events).toEqual(['progress', 'progress', 'done']);
  });

  it('serve snapshot fresco sem coletar', async () => {
    const { collector, store, service } = setup();
    store.save(deriveSnapshot(collectedFor('dev'), NOW), new Date(NOW.getTime() + 1000));
    expect(await service.getProfile('dev')).toMatchObject({ status: 'ok', stale: false });
    expect(collector.calls).toBe(0);
  });

  it('serve snapshot vencido e atualiza em segundo plano', async () => {
    const { collector, store, service } = setup();
    collector.profiles.set('dev', collectedFor('dev'));
    store.save(deriveSnapshot(collectedFor('dev'), NOW), new Date(NOW.getTime() - 1));
    expect(await service.getProfile('dev')).toMatchObject({ status: 'ok', stale: true });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(collector.calls).toBe(1);
    expect(store.find('dev')?.expiresAt.getTime()).toBeGreaterThan(NOW.getTime());
  });

  it('trata snapshot de versão antiga como vencido', async () => {
    const { store, service } = setup();
    store.save(
      { ...deriveSnapshot(collectedFor('dev'), NOW), version: 0 },
      new Date(NOW.getTime() + 1000),
    );
    expect(await service.getProfile('dev')).toMatchObject({ stale: true });
  });

  it('faz uma coleta por login por vez', async () => {
    const { collector, service } = setup();
    collector.profiles.set('dev', collectedFor('dev'));
    collector.hold();
    const pending = [service.getProfile('dev'), service.getProfile('DEV')];
    expect(service.isCollecting('dev')).toBe(true);
    collector.open();
    await Promise.all(pending);
    expect(collector.calls).toBe(1);
  });

  it('devolve not_found para login inexistente', async () => {
    const { service } = setup();
    expect(await service.getProfile('ghost')).toEqual({ status: 'not_found' });
  });

  it('devolve unavailable em falha do GitHub e registra log', async () => {
    const { collector, logger, service } = setup();
    collector.failure = new GithubError('rate_limited', 'cota', new Date('2026-09-30T13:00:00Z'));
    expect(await service.getProfile('dev')).toMatchObject({
      status: 'unavailable',
      reason: 'rate_limited',
    });
    expect(logger.events()).toContain('collection.failed');
  });

  it('não coleta com cota baixa e sem snapshot', async () => {
    const { collector, quota, service } = setup();
    quota.record({ limit: 5000, remaining: 10, resetAt: '2026-09-30T13:00:00Z' });
    expect(await service.getProfile('dev')).toMatchObject({
      status: 'unavailable',
      reason: 'cota baixa',
    });
    expect(collector.calls).toBe(0);
  });
});
