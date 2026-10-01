import type { GithubTransport } from '../../src/github/client.js';
import type { RestRepo, RestUser } from '../../src/github/mappers.js';

/** API do GitHub em memória: responde REST e GraphQL a partir de dados configurados. */
export class FakeGithubTransport implements GithubTransport {
  readonly users = new Map<string, RestUser>();
  /** Repositórios por login; servidos em páginas de `per_page`. */
  readonly repos = new Map<string, RestRepo[]>();
  readonly firstForks = new Map<string, string>();
  readonly dailyContributions = new Map<
    number,
    Array<{ date: string; contributionCount: number }>
  >();
  readonly orgCommits: Array<{
    year: number;
    repo: string;
    language: string | null;
    commits: number;
  }> = [];
  readonly calls: string[] = [];

  async getJson(path: string): Promise<unknown> {
    this.calls.push(`GET ${path.split('?')[0]}`);
    const url = new URL(path, 'https://api.test');
    const [, , login = '', resource] = url.pathname.split('/');
    const key = decodeURIComponent(login).toLowerCase();
    if (resource === 'repos') return this.reposPage(key, url.searchParams);
    return this.users.get(key) ?? null;
  }

  async graphql(query: string): Promise<unknown> {
    if (query.includes('contributionsCollection')) {
      this.calls.push('graphql contributions');
      return { user: { year: this.yearCollection(Number(/from: "(\d{4})/.exec(query)?.[1])) } };
    }
    this.calls.push('graphql forks');
    return this.forksPage(query);
  }

  private reposPage(login: string, params: URLSearchParams): RestRepo[] {
    const perPage = Number(params.get('per_page'));
    const page = Number(params.get('page'));
    return (this.repos.get(login) ?? []).slice((page - 1) * perPage, page * perPage);
  }

  private forksPage(query: string): Record<string, unknown> {
    const page: Record<string, unknown> = {};
    for (const [, alias, name] of query.matchAll(
      /(r\d+): repository\(owner: "[^"]+", name: "([^"]+)"\)/g,
    )) {
      const createdAt = this.firstForks.get(name ?? '');
      page[alias ?? ''] = { forks: { nodes: createdAt ? [{ createdAt }] : [] } };
    }
    return page;
  }

  private yearCollection(year: number) {
    return {
      contributionCalendar: {
        weeks: [{ contributionDays: this.dailyContributions.get(year) ?? [] }],
      },
      commitContributionsByRepository: this.orgCommits
        .filter((entry) => entry.year === year)
        .map((entry) => ({
          repository: {
            nameWithOwner: entry.repo,
            owner: { __typename: 'Organization' },
            primaryLanguage: entry.language ? { name: entry.language } : null,
          },
          contributions: { totalCount: entry.commits },
        })),
    };
  }
}

export function makeRestUser(overrides: Partial<RestUser> = {}): RestUser {
  return {
    login: 'someone',
    name: 'Someone',
    avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
    bio: null,
    html_url: 'https://github.com/someone',
    created_at: '2024-02-01T00:00:00Z',
    type: 'User',
    public_repos: 0,
    ...overrides,
  };
}

export function makeRestRepo(overrides: Partial<RestRepo> & { name: string }): RestRepo {
  return {
    html_url: `https://github.com/someone/${overrides.name}`,
    description: null,
    homepage: '',
    language: null,
    topics: [],
    stargazers_count: 0,
    forks_count: 0,
    fork: false,
    archived: false,
    private: false,
    size: 10,
    created_at: '2024-03-01T00:00:00Z',
    pushed_at: null,
    ...overrides,
  };
}
