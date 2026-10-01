import { describe, expect, it } from 'vitest';
import { maxMonth, recentMonths } from '../../src/domain/contributions.js';

describe('recentMonths', () => {
  it('atravessa a virada do ano e completa meses sem dado com 0', () => {
    const months = { 2025: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 6], 2026: [1, 2, 3] };
    expect(recentMonths(months, 4, new Date('2026-02-15T00:00:00Z'))).toEqual([5, 6, 1, 2]);
    expect(recentMonths({}, 3, new Date('2026-02-15T00:00:00Z'))).toEqual([0, 0, 0]);
  });
});

describe('maxMonth', () => {
  it('nunca é menor que 1', () => {
    expect(maxMonth({})).toBe(1);
    expect(maxMonth({ 2024: [3, 9, 1] })).toBe(9);
  });
});
