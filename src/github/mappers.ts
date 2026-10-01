import type { GithubAccount, OrgContribution, Repo } from '../domain/types.js';
import { GithubError } from './errors.js';

/** Formato de `GET /users/{login}` usado aqui. */
export interface RestUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  html_url: string;
  created_at: string;
  type: string;
  public_repos?: number;
}

/** Formato de `GET /users/{login}/repos` usado aqui. */
export interface RestRepo {
  name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
  archived: boolean;
  private: boolean;
  size: number;
  created_at: string;
  pushed_at: string | null;
}

export interface GraphqlYearContributions {
  contributionCalendar: {
    weeks: Array<{ contributionDays: Array<{ date: string; contributionCount: number }> }>;
  };
  commitContributionsByRepository: Array<{
    repository: {
      nameWithOwner: string;
      owner: { __typename: string };
      primaryLanguage: { name: string } | null;
    };
    contributions: { totalCount: number };
  }>;
}

/**
 * Converte a resposta REST em conta do domínio, validando o mínimo necessário.
 * @example toAccount(await transport.getJson('/users/torvalds'))
 */
export function toAccount(raw: unknown): GithubAccount {
  const user = raw as Partial<RestUser> | null;
  if (!user?.login || !user.created_at) {
    throw new GithubError(
      'invalid_response',
      `GET /users: esperado {login, created_at}, recebido ${preview(raw)}.`,
    );
  }
  return {
    login: user.login,
    name: user.name ?? null,
    avatarUrl: user.avatar_url ?? '',
    bio: user.bio ?? null,
    htmlUrl: user.html_url ?? `https://github.com/${user.login}`,
    createdAt: user.created_at,
    type: user.type === 'Organization' ? 'Organization' : 'User',
  };
}

/** Converte um repositório REST no modelo do domínio; a data do primeiro fork vem depois. */
export function toRepo(raw: RestRepo): Repo {
  return {
    name: raw.name,
    url: raw.html_url,
    description: raw.description,
    language: raw.language,
    topics: raw.topics ?? [],
    stars: raw.stargazers_count,
    forks: raw.forks_count,
    isFork: raw.fork,
    archived: raw.archived,
    homepage: raw.homepage || null,
    sizeKb: raw.size,
    createdAt: raw.created_at,
    pushedAt: raw.pushed_at,
    firstForkAt: null,
  };
}

/**
 * Soma o calendário diário em 12 meses do ano informado.
 * @example toMonthlyRow(2024, collection) // [3, 0, 12, …]
 */
export function toMonthlyRow(year: number, collection: GraphqlYearContributions): number[] {
  const row = Array<number>(12).fill(0);
  for (const week of collection.contributionCalendar.weeks) {
    for (const day of week.contributionDays) {
      if (!day.date.startsWith(`${year}-`)) continue;
      const month = Number(day.date.slice(5, 7)) - 1;
      row[month] = (row[month] ?? 0) + day.contributionCount;
    }
  }
  return row;
}

/** Contribuições de commit em repositórios cujo dono é uma organização. */
export function toOrgContributions(
  year: number,
  collection: GraphqlYearContributions,
): OrgContribution[] {
  return collection.commitContributionsByRepository
    .filter((entry) => entry.repository.owner.__typename === 'Organization')
    .map((entry) => ({
      year,
      repo: entry.repository.nameWithOwner,
      language: entry.repository.primaryLanguage?.name ?? null,
      commits: entry.contributions.totalCount,
    }));
}

/** Trecho curto do valor recebido, para mensagens de erro. */
export function preview(value: unknown): string {
  const text = JSON.stringify(value) ?? String(value);
  return text.length > 120 ? `${text.slice(0, 120)}…` : text;
}
