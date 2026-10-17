import { describe, expect, it } from 'vitest';
import { chartGeometry } from '../../src/views/statistics/chart-geometry.js';
import { statisticsDate } from '../../src/views/statistics/format.js';

describe('statistics chart', () => {
  it('places zero at the baseline with evenly spaced days and an even ceiling', () => {
    const geometry = chartGeometry([
      { day: '2026-10-01', total: 0 },
      { day: '2026-10-02', total: 3 },
      { day: '2026-10-03', total: 4 },
    ]);
    expect(geometry.ceiling).toBe(4);
    expect(geometry.line).toBe('56,220 500,88 944,44');
    expect(geometry.points[1]?.day).toBe('2026-10-02');
  });

  it('handles empty, flat and single-point series without invalid coordinates', () => {
    expect(chartGeometry([])).toEqual({ ceiling: 2, points: [], line: '' });
    expect(chartGeometry([{ day: '2026-10-01', total: 0 }]).line).toBe('56,220');
    expect(chartGeometry([{ day: '2026-10-01', total: 5 }]).ceiling).toBe(6);
  });

  it('formats dates in UTC and the default project language', () => {
    expect(statisticsDate('2026-10-17')).toContain('17');
    expect(statisticsDate('2026-10-17')).toContain('out');
  });
});
