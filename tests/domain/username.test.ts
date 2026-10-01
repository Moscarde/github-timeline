import { describe, expect, it } from 'vitest';
import { isValidUsername, usernameKey, parseUsernameInput } from '../../src/domain/username.js';

describe('parseUsernameInput', () => {
  it.each([
    ['torvalds', 'torvalds'],
    ['  @torvalds ', 'torvalds'],
    ['https://github.com/torvalds', 'torvalds'],
    ['github.com/TeoCalvo/', 'TeoCalvo'],
    ['https://www.github.com/tj?tab=repositories', 'tj'],
  ])('aceita %s', (input, expected) => {
    expect(parseUsernameInput(input)).toBe(expected);
  });

  it.each(['', '-abc', 'abc-', 'a--b', 'a'.repeat(40), 'https://gitlab.com/x', 'a b'])(
    'rejeita %j',
    (input) => {
      expect(parseUsernameInput(input)).toBeNull();
    },
  );
});

describe('username helpers', () => {
  it('valida e normaliza', () => {
    expect(isValidUsername('a-b')).toBe(true);
    expect(usernameKey('TeoCalvo')).toBe('teocalvo');
  });
});
