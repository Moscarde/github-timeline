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
  it('conta todas as aberturas e separa visitantes por perfil/dia sem guardar o IP', () => {
    const { tracker, store } = trackerAt('2026-09-30T10:00:00Z');
    tracker.record('torvalds', '203.0.113.7');
    tracker.record('Torvalds', '203.0.113.7');
    tracker.record('torvalds', '198.51.100.1');
    expect(tracker.totalCount()).toBe(3);
    expect(store.countSince('2026-09-30')).toBe(2);
    expect(JSON.stringify([...store.rows.values()])).not.toContain('203.0.113.7');
  });

  it('preserva o total além de 30 dias e limita Em alta à janela de 7 dias', () => {
    const { tracker, store, clock } = trackerAt('2026-09-01T10:00:00Z');
    tracker.record('antigo', 'ip');
    clock.now = new Date('2026-09-24T10:00:00Z');
    tracker.record('gaearon', 'ip');
    clock.now = new Date('2026-09-30T10:00:00Z');
    tracker.record('torvalds', 'a');
    tracker.record('torvalds', 'b');
    tracker.record('gaearon', 'c');
    expect(tracker.totalCount()).toBe(5);
    expect(tracker.trending(5)).toEqual(['gaearon', 'torvalds']);
    clock.now = new Date('2026-10-02T10:00:00Z');
    tracker.record('x', 'ip');
    expect(tracker.totalCount()).toBe(6);
    expect([...store.rows.values()].some((visit) => visit.username === 'antigo')).toBe(false);
  });
});

describe('SqliteVisitStore', () => {
  it('persiste eventos por dia, tipo, status e idioma sem afetar timelines', () => {
    const db = openDatabase(':memory:');
    const store = new SqliteVisitStore(db);
    expect(store.totalCount()).toBe(0);
    const event = { day: '2026-10-17', event: 'search', status: 302, locale: 'en' };
    store.recordEvent(event);
    store.recordEvent(event);
    store.recordEvent({ ...event, status: 400 });
    store.recordEvent({ ...event, locale: 'pt-BR' });
    store.recordEvent({ ...event, day: '2026-10-18' });
    store.recordEvent({ ...event, event: 'comparison' });
    expect(
      db.prepare('SELECT SUM(total) AS total, COUNT(*) AS buckets FROM event_daily').get(),
    ).toEqual({ total: 6, buckets: 5 });
    expect(store.totalCount()).toBe(0);
    db.close();
  });

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
    expect(store.totalCount()).toBe(4);
  });
});

describe('dayOf', () => {
  it('usa o dia UTC', () => {
    expect(dayOf(new Date('2026-09-30T23:30:00-03:00'))).toBe('2026-10-01');
  });
});
