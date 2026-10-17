import type {
  DailyTimelines,
  StatisticsStore,
  UsageStatistics,
} from '../storage/statistics-store.js';
import { dayOf } from './visit-tracker.js';

const DAY_MS = 86_400_000;
export type StatisticsPeriod = 7 | 30 | 90;
export interface StatisticsReport extends UsageStatistics {
  period: StatisticsPeriod;
  periodTimelines: number;
  start: string;
  end: string;
}

/** Limit public queries to predictable windows. @example statisticsPeriod('7') // 7 */
export function statisticsPeriod(value: string | undefined): StatisticsPeriod {
  if (value === '7') return 7;
  if (value === '90') return 90;
  return 30;
}

/** Build a continuous UTC series, including inactive days. @example timelineDays([], new Date(), 7) */
export function timelineDays(
  rows: DailyTimelines[],
  now: Date,
  period: StatisticsPeriod,
): DailyTimelines[] {
  const totals = new Map(rows.map((row) => [row.day, row.total]));
  return Array.from({ length: period }, (_, index) => {
    const day = dayOf(new Date(now.getTime() - (period - 1 - index) * DAY_MS));
    return { day, total: totals.get(day) ?? 0 };
  });
}

/** Assemble live statistics without visitor records. @example statistics.report(30) */
export class StatisticsService {
  constructor(
    private readonly store: StatisticsStore,
    private readonly now: () => Date,
  ) {}

  /** Apply the same UTC window to every period metric. @example service.report(7) */
  report(period: StatisticsPeriod): StatisticsReport {
    const now = this.now();
    const start = dayOf(new Date(now.getTime() - (period - 1) * DAY_MS));
    const end = dayOf(now);
    const aggregates = this.store.read(start, end);
    const daily = timelineDays(aggregates.daily, now, period);
    return {
      ...aggregates,
      daily,
      period,
      start,
      end,
      periodTimelines: daily.reduce((total, row) => total + row.total, 0),
    };
  }
}
