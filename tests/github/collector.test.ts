import { describe, expect, it } from 'vitest';
import { GithubProfileCollector, type CollectionProgress } from '../../src/github/collector.js';
import { FakeGithubTransport, makeRestRepo, makeRestUser } from '../fakes/fake-github-transport.js';

const now = () => new Date('2026-09-30T00:00:00Z');

function repos(count: number) {
  return Array.from({ length: count }, (_, index) => makeRestRepo({ name: `r${index}` }));
}

describe('GithubProfileCollector', () => {
  it('devolve null para username inexistente', async () => {
    const collector = new GithubProfileCollector(new FakeGithubTransport(), now);
    expect(await collector.collect('ghost')).toBeNull();
  });

  it('mapeia repositórios, primeiro fork e contribuições por mês', async () => {
    const api = new FakeGithubTransport();
    api.users.set('someone', makeRestUser({ public_repos: 2 }));
    api.repos.set('someone', [
      makeRestRepo({ name: 'a', language: 'Go', topics: ['cli'], forks_count: 3 }),
      makeRestRepo({ name: 'b' }),
    ]);
    api.firstForks.set('a', '2025-01-01T00:00:00Z');
    api.dailyContributions.set(2025, [
      { date: '2025-03-01', contributionCount: 2 },
      { date: '2025-03-15', contributionCount: 3 },
      { date: '2024-12-31', contributionCount: 99 },
    ]);
    api.orgCommits.push({ year: 2025, repo: 'org/x', language: 'Rust', commits: 7 });
    const stages: CollectionProgress['stage'][] = [];

    const collected = await new GithubProfileCollector(api, now).collect('someone', (p) =>
      stages.push(p.stage),
    );

    expect(collected?.repos.map((repo) => repo.name)).toEqual(['a', 'b']);
    expect(collected?.repos[0]).toMatchObject({ language: 'Go', topics: ['cli'], homepage: null });
    expect(collected?.repos[0]?.firstForkAt).toBe('2025-01-01T00:00:00Z');
    expect(collected?.repos[1]?.firstForkAt).toBeNull();
    expect(collected?.months[2025]?.[2]).toBe(5);
    expect(collected?.months[2025]?.[11]).toBe(0);
    expect(Object.keys(collected?.months ?? {})).toEqual(['2024', '2025', '2026']);
    expect(collected?.orgContributions).toEqual([
      { year: 2025, repo: 'org/x', language: 'Rust', commits: 7 },
    ]);
    expect(stages[0]).toBe('perfil');
    expect(stages).toHaveLength(3);
  });

  it('pede as páginas previstas e segue se public_repos estiver defasado', async () => {
    const api = new FakeGithubTransport();
    api.users.set('someone', makeRestUser({ public_repos: 150 }));
    api.repos.set('someone', repos(250));
    const collected = await new GithubProfileCollector(api, now).collect('someone');
    expect(collected?.repos).toHaveLength(250);
    expect(api.calls.filter((call) => call.endsWith('/repos'))).toHaveLength(3);
  });

  it('descarta repositórios privados (proteção para a conta dona do token)', async () => {
    const api = new FakeGithubTransport();
    api.users.set('someone', makeRestUser({ public_repos: 1 }));
    api.repos.set('someone', [
      makeRestRepo({ name: 'pub' }),
      makeRestRepo({ name: 'sec', private: true }),
    ]);
    const collected = await new GithubProfileCollector(api, now).collect('someone');
    expect(collected?.repos.map((repo) => repo.name)).toEqual(['pub']);
  });

  it('só consulta forks de repositórios próprios já forkados, em lotes de 50', async () => {
    const api = new FakeGithubTransport();
    api.users.set('someone', makeRestUser({ public_repos: 120 }));
    api.repos.set('someone', [
      ...Array.from({ length: 110 }, (_, i) => makeRestRepo({ name: `f${i}`, forks_count: 1 })),
      ...Array.from({ length: 10 }, (_, i) =>
        makeRestRepo({ name: `x${i}`, fork: true, forks_count: 5 }),
      ),
    ]);
    await new GithubProfileCollector(api, now).collect('someone');
    expect(api.calls.filter((call) => call === 'graphql forks')).toHaveLength(3);
  });

  it('pede contribuições um ano por vez', async () => {
    const api = new FakeGithubTransport();
    api.users.set(
      'veteran',
      makeRestUser({ login: 'veteran', created_at: '2008-01-01T00:00:00Z' }),
    );
    await new GithubProfileCollector(api, now).collect('veteran');
    expect(api.calls.filter((call) => call === 'graphql contributions')).toHaveLength(19);
  });

  it('em organizações, só busca os maiores contribuidores, sem bots', async () => {
    const api = new FakeGithubTransport();
    api.users.set('acme', makeRestUser({ login: 'acme', type: 'Organization' }));
    api.orgRepos.set('acme', ['acme/core', 'acme/docs']);
    const person = (login: string, contributions: number, type = 'User') => ({
      login,
      avatar_url: `https://avatars.githubusercontent.com/${login}`,
      type,
      contributions,
    });
    api.contributors.set('acme/core', [person('ana', 40), person('bot', 900, 'Bot')]);
    api.contributors.set('acme/docs', [person('bia', 30), person('ana', 5)]);

    const collected = await new GithubProfileCollector(api, now).collect('acme');

    expect(collected?.repos).toEqual([]);
    expect(collected?.people?.map((p) => [p.username, p.contributions])).toEqual([
      ['ana', 45],
      ['bia', 30],
    ]);
    expect(api.calls).not.toContain('graphql contributions');
  });
});
