import type { DailyTimelines } from '../../storage/statistics-store.js';

export interface ChartPoint extends DailyTimelines {
  x: number;
  y: number;
}
export interface ChartGeometry {
  points: ChartPoint[];
  line: string;
  ceiling: number;
}

/** Scale a daily series from zero into a fixed SVG viewport. @example chartGeometry([{ day: '2026-10-17', total: 3 }]) */
export function chartGeometry(daily: DailyTimelines[]): ChartGeometry {
  const maximum = Math.max(1, ...daily.map((row) => row.total));
  const ceiling = Math.max(2, Math.ceil(maximum / 2) * 2);
  const points = daily.map((row, index) => ({
    ...row,
    x: 56 + (index / Math.max(1, daily.length - 1)) * 888,
    y: 220 - (row.total / ceiling) * 176,
  }));
  return { points, ceiling, line: points.map((point) => `${point.x},${point.y}`).join(' ') };
}
