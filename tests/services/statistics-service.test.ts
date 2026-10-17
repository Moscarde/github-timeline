import { describe, expect, it } from 'vitest';
import {
  StatisticsService,
  statisticsPeriod,
  timelineDays,
} from '../../src/services/statistics-service.js';
import { InMemoryVisitStore } from '../fakes/in-memory-visit-store.js';
import { InMemoryStatisticsStore } from '../fakes/in-memory-statistics-store.js';

const NOW = new Date('2026-10-17T23:30:00-03:00');

describe('statisticsPeriod', () => {
  it.each([
    ['7', 7],
    ['30', 30],
    ['90', 90],
    [undefined, 30],
    ['-1', 30],
    ['999999', 30],
    ['7.0', 30],
    ['invalid', 30],
  ])('bounds %s to %s', (input, expected) => {
    expect(statisticsPeriod(input)).toBe(expected);
  });
});

describe('timelineDays', () => {
  it('fills inactive dates across months and anchors today in UTC', () => {
    const rows = timelineDays(
      [{ day: '2026-09-30', total: 5 }],
      new Date('2026-10-03T12:00:00Z'),
      7,
    );
    expect(rows).toHaveLength(7);
    expect(rows[0]).toEqual({ day: '2026-09-27', total: 0 });
    expect(rows[3]).toEqual({ day: '2026-09-30', total: 5 });
    expect(rows[6]).toEqual({ day: '2026-10-03', total: 0 });
    expect(timelineDays([], NOW, 7).at(-1)?.day).toBe('2026-10-18');
  });
});

describe('StatisticsService', () => {
  it.each([7, 30, 90] as const)('reconciles ranks, KPIs and series over %i days', (period) => {
    const visits = new InMemoryVisitStore();
    visits.record({ username: 'dev', day: '2026-10-18', visitor: 'secret' });
    visits.record({ username: 'dev', day: '2026-10-18', visitor: 'secret' });
    visits.record({ username: 'old', day: '2025-01-01', visitor: 'secret' });
    const service = new StatisticsService(new InMemoryStatisticsStore(visits), () => NOW);
    const report = service.report(period);
    expect(report.allTimeTimelines).toBe(3);
    expect(report.periodTimelines).toBe(2);
    expect(report.profileCount).toBe(1);
    expect(report.daily).toHaveLength(period);
    expect(report.daily.at(-1)).toEqual({ day: '2026-10-18', total: 2 });
    expect(report.ranking).toEqual([{ username: 'dev', total: 2 }]);
    expect(report.end).toBe('2026-10-18');
  });
});
