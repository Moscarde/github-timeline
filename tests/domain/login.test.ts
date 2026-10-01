import { describe, expect, it } from 'vitest';
import { isValidLogin, loginKey, parseLoginInput } from '../../src/domain/login.js';

describe('parseLoginInput', () => {
  it.each([
    ['torvalds', 'torvalds'],
    ['  @torvalds ', 'torvalds'],
    ['https://github.com/torvalds', 'torvalds'],
    ['github.com/TeoCalvo/', 'TeoCalvo'],
    ['https://www.github.com/tj?tab=repositories', 'tj'],
  ])('aceita %s', (input, expected) => {
    expect(parseLoginInput(input)).toBe(expected);
  });

  it.each(['', '-abc', 'abc-', 'a--b', 'a'.repeat(40), 'https://gitlab.com/x', 'a b'])(
    'rejeita %j',
    (input) => {
      expect(parseLoginInput(input)).toBeNull();
    },
  );
});

describe('login helpers', () => {
  it('valida e normaliza', () => {
    expect(isValidLogin('a-b')).toBe(true);
    expect(loginKey('TeoCalvo')).toBe('teocalvo');
  });
});
