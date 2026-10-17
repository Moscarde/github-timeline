import type { StatisticsStore, UsageStatistics } from '../../src/storage/statistics-store.js';
import type { InMemoryVisitStore } from './in-memory-visit-store.js';

/** Aggregate only public usage fields, matching the SQL reader. */
export class InMemoryStatisticsStore implements StatisticsStore {
  constructor(private readonly visits: InMemoryVisitStore) {}

  read(start: string, end: string): UsageStatistics {
    const openings = this.visits.openings.filter((visit) => visit.day >= start && visit.day <= end);
    const events = this.visits.events.filter(
      (event) =>
        event.day >= start &&
        event.day <= end &&
        (['search', 'comparison_search'].includes(event.event)
          ? event.status === 302
          : event.status === 200),
    );
    const ranking = countBy(openings.map((visit) => visit.username.toLowerCase())).sort(
      ([left, leftTotal], [right, rightTotal]) =>
        rightTotal - leftTotal || left.localeCompare(right),
    );
    return {
      allTimeTimelines: this.visits.totalCount(),
      profileCount: ranking.length,
      daily: countBy(openings.map((visit) => visit.day)).map(([day, total]) => ({ day, total })),
      ranking: ranking.slice(0, 10).map(([username, total]) => ({ username, total })),
      events: countBy(events.map((event) => event.event)).map(([event, total]) => ({
        event,
        total,
      })),
    };
  }
}

function countBy(keys: string[]): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1);
  return [...counts];
}
