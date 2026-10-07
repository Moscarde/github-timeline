import { describe, expect, it } from 'vitest';
import {
  formatAge,
  formatCompact,
  formatInteger,
  formatMonthYear,
  formatPercent,
  formatRatio,
  joinPt,
  monthNames,
  plural,
} from '../../src/domain/format.js';

describe('English formatting', () => {
  it('formats counts, percentages, ratios and compact numbers', () => {
    expect(formatInteger(1234, 'en')).toBe('1,234');
    expect(formatCompact(999, 'en')).toBe('999');
    expect(formatCompact(1400, 'en')).toBe('1.4k');
    expect(formatCompact(1240000, 'en')).toBe('1.2m');
    expect(formatPercent(0.417, 'en')).toBe('41.7%');
    expect(formatRatio(3.62, 'en')).toBe('3.6×');
    expect(formatRatio(1250, 'en')).toBe('1,250×');
  });

  it('uses English months, joining and pluralization', () => {
    expect(formatMonthYear('2026-02-01T00:00:00Z', 'en')).toBe('Feb 2026');
    expect(monthNames('en')[8]).toBe('Sep');
    expect(monthNames()[1]).toBe('fev');
    expect(joinPt(['Go', 'Rust'], 'en')).toBe('Go and Rust');
    expect(joinPt([], 'en')).toBe('');
    expect(plural(1, 'ano', 'anos', 'en')).toBe('1 year');
    expect(plural(1234, 'repositório', 'repositórios', 'en')).toBe('1,234 repositories');
  });

  it.each([
    ['2026-09-30T11:59:40Z', 'just now'],
    ['2026-09-30T11:35:00Z', '25 minutes ago'],
    ['2026-09-30T09:00:00Z', '3 hours ago'],
    ['2026-09-29T11:00:00Z', '1 day ago'],
  ])('formats age of %s', (since, expected) => {
    expect(formatAge(new Date(since), new Date('2026-09-30T12:00:00Z'), 'en')).toBe(expected);
  });
});
