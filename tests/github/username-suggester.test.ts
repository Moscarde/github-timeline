import { describe, expect, it } from 'vitest';
import type { GithubTransport } from '../../src/github/client.js';
import { GithubUsernameSuggester } from '../../src/github/username-suggester.js';

/** Busca de usuários com resposta fixa; conta as chamadas para testar o cache. */
class SearchUsersTransport implements GithubTransport {
  calls = 0;
  constructor(private readonly result: unknown | Error) {}

  async getJson(): Promise<unknown> {
    this.calls += 1;
    if (this.result instanceof Error) throw this.result;
    return this.result;
  }

  async graphql(): Promise<unknown> {
    throw new Error('não usado');
  }
}

const now = () => new Date('2026-09-30T00:00:00Z');

describe('GithubUsernameSuggester', () => {
  it('sugere o primeiro resultado e cacheia', async () => {
    const api = new SearchUsersTransport({ items: [{ login: 'torvalds', avatar_url: 'a' }] });
    const suggester = new GithubUsernameSuggester(api, now);
    expect(await suggester.suggest('torvaldz')).toEqual({ username: 'torvalds', avatarUrl: 'a' });
    await suggester.suggest('TORVALDZ');
    expect(api.calls).toBe(1);
  });

  it('não sugere o próprio username nem quebra com erro da API', async () => {
    const same = new SearchUsersTransport({ items: [{ login: 'Dev', avatar_url: 'a' }] });
    expect(await new GithubUsernameSuggester(same, now).suggest('dev')).toBeNull();
    const failing = new SearchUsersTransport(new Error('rede'));
    expect(await new GithubUsernameSuggester(failing, now).suggest('dev')).toBeNull();
  });
});
