import { describe, expect, it } from 'vitest';
import { parseTrailStyle } from '../../src/embed/trail-options.js';

describe('parseTrailStyle', () => {
  it('aceita completo e compacto; o resto cai no completo', () => {
    expect(parseTrailStyle('compacto')).toBe('compacto');
    expect(parseTrailStyle('completo')).toBe('completo');
    expect(parseTrailStyle('enxuto')).toBe('completo');
    expect(parseTrailStyle(undefined)).toBe('completo');
  });
});
