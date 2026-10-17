import { describe, expect, it } from 'vitest';
import { openDatabase } from '../../src/storage/database.js';
import { SqliteStatisticsStore } from '../../src/storage/statistics-store.js';
import { SqliteVisitStore } from '../../src/storage/visit-store.js';

function statisticsDatabase() {
  const db = openDatabase(':memory:');
  return { db, visits: new SqliteVisitStore(db), statistics: new SqliteStatisticsStore(db) };
}

describe('SqliteStatisticsStore', () => {
  it('returns explicit empty aggregates without any visitor fields', () => {
    const { db, statistics } = statisticsDatabase();
    expect(statistics.read('2026-10-01', '2026-10-30')).toEqual({
      allTimeTimelines: 0,
      profileCount: 0,
      daily: [],
      ranking: [],
      events: [],
    });
    db.close();
  });

  it('counts repeat views, bounds all period metrics and keeps cumulative history', () => {
    const { db, visits, statistics } = statisticsDatabase();
    for (const day of ['2026-09-30', '2026-10-01', '2026-10-30', '2026-10-31']) {
      visits.record({ username: 'Dev', day, visitor: 'private-visitor-hash' });
    }
    visits.record({ username: 'dev', day: '2026-10-01', visitor: 'private-visitor-hash' });
    visits.record({ username: 'ana', day: '2026-10-30', visitor: 'another-private-hash' });
    visits.purgeBefore('2026-12-01');
    expect(statistics.read('2026-10-01', '2026-10-30')).toEqual({
      allTimeTimelines: 6,
      profileCount: 2,
      daily: [
        { day: '2026-10-01', total: 2 },
        { day: '2026-10-30', total: 2 },
      ],
      ranking: [
        { username: 'dev', total: 3 },
        { username: 'ana', total: 1 },
      ],
      events: [],
    });
    expect(JSON.stringify(statistics.read('2026-10-01', '2026-10-30'))).not.toContain('private');
    db.close();
  });

  it('uses successful outcomes and aggregates across languages', () => {
    const { db, visits, statistics } = statisticsDatabase();
    for (const locale of ['en', 'pt-BR']) {
      for (const [event, status] of [
        ['search', 302],
        ['search', 400],
        ['comparison', 200],
        ['comparison', 202],
        ['card', 503],
        ['badge', 200],
      ] as const) {
        visits.recordEvent({ day: '2026-10-01', event, status, locale });
      }
    }
    visits.recordEvent({ day: '2026-09-30', event: 'search', status: 302, locale: 'en' });
    visits.recordEvent({ day: '2026-10-31', event: 'badge', status: 200, locale: 'en' });
    expect(statistics.read('2026-10-01', '2026-10-30').events).toEqual([
      { event: 'badge', total: 2 },
      { event: 'comparison', total: 2 },
      { event: 'search', total: 2 },
    ]);
    db.close();
  });

  it('limits ranks to ten public profiles with deterministic ties', () => {
    const { db, visits, statistics } = statisticsDatabase();
    for (let index = 11; index >= 0; index--) {
      visits.record({
        username: `dev-${String(index).padStart(2, '0')}`,
        day: '2026-10-01',
        visitor: 'secret',
      });
    }
    const report = statistics.read('2026-10-01', '2026-10-30');
    expect(report.profileCount).toBe(12);
    expect(report.ranking).toHaveLength(10);
    expect(report.ranking[0]).toEqual({ username: 'dev-00', total: 1 });
    expect(report.ranking[9]).toEqual({ username: 'dev-09', total: 1 });
    db.close();
  });
});
