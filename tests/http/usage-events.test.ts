import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { usageEvents } from '../../src/http/usage-events.js';
import { VisitTracker } from '../../src/services/visit-tracker.js';
import type { UsageEvent } from '../../src/storage/visit-store.js';
import { InMemoryVisitStore } from '../fakes/in-memory-visit-store.js';
import { MemoryLogger } from '../fakes/memory-logger.js';

class FailingEventStore extends InMemoryVisitStore {
  override recordEvent(event: UsageEvent): void {
    throw new Error(`Cannot persist ${event.event}: expected available database`);
  }
}

function usageHarness(store = new InMemoryVisitStore()) {
  const logger = new MemoryLogger();
  const now = (): Date => new Date('2026-10-17T12:00:00Z');
  const visits = new VisitTracker({ store, now, salt: 'test' });
  const app = new Hono();
  app.use('*', usageEvents({ visits, logger }));
  app.get('*', (c) => c.text('ok', 202));
  return { app, store, logger };
}

describe('usageEvents', () => {
  it.each([
    ['/', 'landing'],
    ['/buscar?q=private-query', 'search'],
    ['/comparar?a=dev&b=ana', 'comparison_search'],
    ['/u/dev', 'timeline'],
    ['/u/dev...ana', 'comparison'],
    ['/u/dev/card.png', 'card'],
    ['/badge/dev.svg', 'badge'],
    ['/api/profile/dev', 'api_profile'],
    ['/api/status/dev', 'api_status'],
    ['/idioma', 'language_change'],
  ])('captures %s without retaining the URL', async (path, event) => {
    const { app, store } = usageHarness();
    await app.request(path, { headers: { 'accept-language': 'en' } });
    expect(store.events).toEqual([{ day: '2026-10-17', event, status: 202, locale: 'en' }]);
  });

  it('ignores health checks, unknown paths, assets and non-GET requests', async () => {
    const { app, store } = usageHarness();
    for (const path of ['/healthz', '/unknown', '/assets/app.js']) await app.request(path);
    await app.request('/u/dev', { method: 'HEAD' });
    await app.request('/buscar', { method: 'POST' });
    expect(store.events).toEqual([]);
  });

  it('preserves the response and logs telemetry failures as JSON fields', async () => {
    const { app, logger } = usageHarness(new FailingEventStore());
    expect((await app.request('/')).status).toBe(202);
    expect(logger.entries).toEqual([
      {
        level: 'error',
        event: 'usage.record_failed',
        fields: {
          eventName: 'landing',
          error: 'Error: Cannot persist landing: expected available database',
        },
      },
    ]);
  });
});
