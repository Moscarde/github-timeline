import type Database from 'better-sqlite3';

export interface DailyTimelines {
  day: string;
  total: number;
}
export interface RankedProfile {
  username: string;
  total: number;
}
export interface EventTotal {
  event: string;
  total: number;
}
export interface UsageStatistics {
  allTimeTimelines: number;
  profileCount: number;
  daily: DailyTimelines[];
  ranking: RankedProfile[];
  events: EventTotal[];
}

/** Public statistics use only anonymous aggregates and public profile usernames. */
export interface StatisticsStore {
  read(start: string, end: string): UsageStatistics;
}

/** Read bounded public aggregates. @example new SqliteStatisticsStore(db).read('2026-10-01', '2026-10-30') */
export class SqliteStatisticsStore implements StatisticsStore {
  constructor(private readonly db: Database.Database) {}

  read(start: string, end: string): UsageStatistics {
    const totals = this.db
      .prepare(
        `SELECT COALESCE(SUM(total), 0) AS allTimeTimelines,
      COUNT(DISTINCT CASE WHEN day BETWEEN ? AND ? THEN username_key END) AS profileCount
      FROM timeline_daily`,
      )
      .get(start, end) as Pick<UsageStatistics, 'allTimeTimelines' | 'profileCount'>;
    return {
      ...totals,
      daily: this.daily(start, end),
      ranking: this.ranking(start, end),
      events: this.events(start, end),
    };
  }

  private daily(start: string, end: string): DailyTimelines[] {
    return this.db
      .prepare(
        `SELECT day, SUM(total) AS total FROM timeline_daily
      WHERE day BETWEEN ? AND ? GROUP BY day ORDER BY day`,
      )
      .all(start, end) as DailyTimelines[];
  }

  private ranking(start: string, end: string): RankedProfile[] {
    return this.db
      .prepare(
        `SELECT username_key AS username, SUM(total) AS total FROM timeline_daily
      WHERE day BETWEEN ? AND ? GROUP BY username_key
      ORDER BY total DESC, username_key ASC LIMIT 10`,
      )
      .all(start, end) as RankedProfile[];
  }

  private events(start: string, end: string): EventTotal[] {
    // Only completed actions enter these indicators; errors and pending responses remain internal.
    return this.db
      .prepare(
        `SELECT event, SUM(total) AS total FROM event_daily
      WHERE day BETWEEN ? AND ? AND ((event IN ('search', 'comparison_search') AND status = 302)
        OR (event NOT IN ('search', 'comparison_search') AND status = 200))
      GROUP BY event ORDER BY total DESC, event ASC`,
      )
      .all(start, end) as EventTotal[];
  }
}
