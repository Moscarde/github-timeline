import type { GithubAccount, OrgContribution, Repo } from '../../src/domain/types.js';

/** Repositório de teste com valores neutros; sobrescreva só o que o teste exercita. */
export function makeRepo(overrides: Partial<Repo> & { name: string; createdAt: string }): Repo {
  return {
    url: `https://github.com/someone/${overrides.name}`,
    description: null,
    language: null,
    topics: [],
    stars: 0,
    forks: 0,
    isFork: false,
    archived: false,
    homepage: null,
    sizeKb: 0,
    pushedAt: null,
    firstForkAt: null,
    ...overrides,
  };
}

let sequence = 0;

/** Atalho: repositório criado em 1º de junho do ano informado, com nome sequencial. */
export function repoIn(year: number, overrides: Partial<Repo> = {}): Repo {
  sequence += 1;
  return makeRepo({
    name: `repo-${year}-${sequence}`,
    createdAt: `${year}-06-01T00:00:00Z`,
    ...overrides,
  });
}

export function makeAccount(overrides: Partial<GithubAccount> = {}): GithubAccount {
  return {
    username: 'someone',
    name: 'Someone',
    avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
    bio: null,
    htmlUrl: 'https://github.com/someone',
    createdAt: '2014-01-01T00:00:00Z',
    type: 'User',
    ...overrides,
  };
}

export function makeOrgContribution(
  overrides: Partial<OrgContribution> & { year: number },
): OrgContribution {
  return { repo: 'org/project', language: null, commits: 1, ...overrides };
}
