import { describe, expect, it } from 'vitest';
import { dayOf, VisitTracker } from '../../src/services/visit-tracker.js';
import { openDatabase } from '../../src/storage/database.js';
import { SqliteVisitStore } from '../../src/storage/visit-store.js';
import { InMemoryVisitStore } from '../fakes/in-memory-visit-store.js';

function trackerAt(iso: string, store = new InMemoryVisitStore()) {
  const clock = { now: new Date(iso) };
  const tracker = new VisitTracker({ store, salt: 's', now: () => clock.now });
  return { tracker, store, clock };
}

describe('VisitTracker', () => {
  it('conta um visitante por username e dia, sem guardar o IP', () => {
    const { tracker, store } = trackerAt('2026-09-30T10:00:00Z');
    tracker.record('torvalds', '203.0.113.7');
    tracker.record('Torvalds', '203.0.113.7');
    tracker.record('torvalds', '198.51.100.1');
    expect(tracker.weeklyCount()).toBe(2);
    expect(JSON.stringify([...store.rows.values()])).not.toContain('203.0.113.7');
  });

  it('janela de 7 dias para contador e "Em alta"; retenção de 30 dias', () => {
    const { tracker, store, clock } = trackerAt('2026-09-01T10:00:00Z');
    tracker.record('antigo', 'ip');
    clock.now = new Date('2026-09-24T10:00:00Z');
    tracker.record('gaearon', 'ip');
    clock.now = new Date('2026-09-30T10:00:00Z');
    tracker.record('torvalds', 'a');
    tracker.record('torvalds', 'b');
    tracker.record('gaearon', 'c');
    expect(tracker.weeklyCount()).toBe(4);
    expect(tracker.trending(5)).toEqual(['gaearon', 'torvalds']);
    clock.now = new Date('2026-10-02T10:00:00Z');
    tracker.record('x', 'ip');
    expect([...store.rows.values()].some((visit) => visit.username === 'antigo')).toBe(false);
  });
});

describe('SqliteVisitStore', () => {
  it('deduplica, conta, ordena e apaga visitas antigas', () => {
    const store = new SqliteVisitStore(openDatabase(':memory:'));
    store.record({ username: 'Dev', day: '2026-09-30', visitor: 'v1' });
    store.record({ username: 'dev', day: '2026-09-30', visitor: 'v1' });
    store.record({ username: 'dev', day: '2026-09-29', visitor: 'v2' });
    store.record({ username: 'ana', day: '2026-09-30', visitor: 'v1' });
    expect(store.countSince('2026-09-30')).toBe(2);
    expect(store.topSince('2026-09-01', 5)).toEqual(['dev', 'ana']);
    store.purgeBefore('2026-09-30');
    expect(store.countSince('2000-01-01')).toBe(2);
  });
});

describe('dayOf', () => {
  it('usa o dia UTC', () => {
    expect(dayOf(new Date('2026-09-30T23:30:00-03:00'))).toBe('2026-10-01');
  });
});
