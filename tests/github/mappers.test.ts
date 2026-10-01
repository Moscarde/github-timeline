import { describe, expect, it } from 'vitest';
import { preview, toAccount } from '../../src/github/mappers.js';
import { makeRestUser } from '../fakes/fake-github-transport.js';

describe('toAccount', () => {
  it('mapeia organizações', () => {
    expect(toAccount(makeRestUser({ type: 'Organization' })).type).toBe('Organization');
  });

  it('informa o valor recebido quando o formato é inválido', () => {
    expect(() => toAccount({ foo: 1 })).toThrow('recebido {"foo":1}');
  });

  it('encurta valores grandes', () => {
    expect(preview('x'.repeat(500)).length).toBeLessThan(130);
  });
});
