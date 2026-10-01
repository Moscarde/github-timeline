import { describe, expect, it } from 'vitest';
import {
  formatCompact,
  formatInteger,
  formatMonthYear,
  formatPercent,
  joinPt,
  plural,
} from '../../src/domain/format.js';

describe('format', () => {
  it('formata inteiros com milhar pt-BR', () => {
    expect(formatInteger(1141)).toBe('1.141');
  });

  it.each([
    [999, '999'],
    [1000, '1k'],
    [1400, '1,4k'],
    [250712, '250,7k'],
    [250693, '250,7k'],
    [999_950, '1 mi'],
    [512_905, '512,9k'],
    [1_240_000, '1,2 mi'],
  ])('compacta %i como %s', (value, expected) => {
    expect(formatCompact(value)).toBe(expected);
  });

  it('formata percentual com uma casa', () => {
    expect(formatPercent(0.417)).toBe('41,7%');
  });

  it('escolhe singular e plural', () => {
    expect(plural(1, 'ano', 'anos')).toBe('1 ano');
    expect(plural(1141, 'repositório', 'repositórios')).toBe('1.141 repositórios');
  });

  it('abrevia mês em UTC', () => {
    expect(formatMonthYear('2014-03-31T23:30:00Z')).toBe('mar 2014');
  });

  it('junta listas com "e"', () => {
    expect(joinPt([])).toBe('');
    expect(joinPt(['Go'])).toBe('Go');
    expect(joinPt(['Go', 'Rust', 'Zig'])).toBe('Go, Rust e Zig');
  });
});
