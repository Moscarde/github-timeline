import { describe, expect, it } from 'vitest';
import type { GithubTransport } from '../../src/github/client.js';
import { ProjectStars } from '../../src/github/project-stars.js';

/** Repositório com contagem de stars configurável. */
class RepoTransport implements GithubTransport {
  stars = 10;
  calls = 0;

  async getJson(): Promise<unknown> {
    this.calls += 1;
    return { stargazers_count: this.stars };
  }

  async graphql(): Promise<unknown> {
    throw new Error('não usado');
  }
}

describe('ProjectStars', () => {
  it('não espera a API e atualiza só depois do vencimento', async () => {
    const api = new RepoTransport();
    const clock = { now: 0 };
    const stars = new ProjectStars(api, 'o/r', () => new Date(clock.now), 1000);
    expect(stars.current()).toBeNull();
    await Promise.resolve();
    expect(stars.current()).toBe(10);
    api.stars = 11;
    expect(stars.current()).toBe(10);
    clock.now = 2000;
    stars.current();
    await Promise.resolve();
    expect(stars.current()).toBe(11);
    expect(api.calls).toBe(2);
  });
});
