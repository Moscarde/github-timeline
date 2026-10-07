import { describe, expect, it } from 'vitest';
import { browserLocale, parseLocale, resolveLocale } from '../../src/i18n/locale.js';

describe('language preferences', () => {
  it.each([
    ['en', 'en'],
    ['en-US', 'en'],
    ['EN-gb', 'en'],
    ['pt', 'pt-BR'],
    ['pt-PT', 'pt-BR'],
    ['pt-BR', 'pt-BR'],
    ['es', null],
    ['', null],
    [undefined, null],
  ])('recognizes %s as %s', (tag, expected) => {
    expect(parseLocale(tag)).toBe(expected);
  });

  it.each([
    [undefined, 'pt-BR'],
    ['es,fr', 'pt-BR'],
    ['en-US,en;q=0.9', 'en'],
    ['en;q=0.5,pt-BR;q=0.9', 'pt-BR'],
    ['es,pt;q=0.8,en;q=0.5', 'pt-BR'],
    ['pt;q=0,en;q=0.5', 'en'],
    ['en;q=0', 'pt-BR'],
    ['en;q=invalid,pt;q=0.1', 'pt-BR'],
    ['en;q=2,pt;q=0.5', 'pt-BR'],
    ['en;q=-1,pt;q=0.5', 'pt-BR'],
    ['pt;q=0.8,en;q=0.8', 'pt-BR'],
    ['en ; q=0.8, pt;q=0.5', 'en'],
  ])('negotiates %s as %s', (header, expected) => {
    expect(browserLocale(header)).toBe(expected);
  });

  it('prioritizes query, saved preference, browser and Portuguese fallback', () => {
    expect(resolveLocale('en', 'pt-BR', 'pt')).toBe('en');
    expect(resolveLocale(undefined, 'pt-BR', 'en')).toBe('pt-BR');
    expect(resolveLocale('invalid', 'invalid', 'en')).toBe('en');
    expect(resolveLocale(undefined, undefined, undefined)).toBe('pt-BR');
  });
});
