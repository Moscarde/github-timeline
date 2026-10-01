import type { Repo } from '../domain/types.js';
import { chunk, mapWithConcurrency } from '../lib/concurrency.js';
import type { GithubTransport } from './client.js';
import { GithubError } from './errors.js';
import { preview, toRepo, type RestRepo } from './mappers.js';
import { firstForksQuery } from './queries.js';

const PER_PAGE = 100;
/** Teto de páginas; o maior perfil medido (sindresorhus) tem ~1.150 repositórios. */
const MAX_PAGES = 30;
const CONCURRENCY = 6;
const FORK_BATCH = 50;

type ForksPage = Record<string, { forks: { nodes: Array<{ createdAt: string }> } } | null>;

/**
 * Repositórios públicos de que o perfil é dono, com a data do primeiro fork.
 * Usa REST porque as páginas podem ser pedidas em paralelo: 1.141 repositórios saem em ~1,3 s,
 * contra ~27 s paginando por cursor no GraphQL (medido em set/2026).
 * @example await fetchOwnedRepos(transport, 'torvalds', 12)
 */
export async function fetchOwnedRepos(
  transport: GithubTransport,
  login: string,
  publicRepos: number,
): Promise<Repo[]> {
  const raw = await fetchAllPages(transport, login, publicRepos);
  // `/users/{login}/repos` só lista públicos; o filtro protege a conta dona do token (§3).
  const repos = raw.filter((repo) => !repo.private).map(toRepo);
  return attachFirstForks(transport, login, repos);
}

async function fetchAllPages(
  transport: GithubTransport,
  login: string,
  publicRepos: number,
): Promise<RestRepo[]> {
  const expected = Math.min(MAX_PAGES, Math.max(1, Math.ceil(publicRepos / PER_PAGE)));
  const numbers = Array.from({ length: expected }, (_, index) => index + 1);
  const pages = await mapWithConcurrency(numbers, CONCURRENCY, (page) =>
    fetchPage(transport, login, page),
  );
  // `public_repos` pode estar defasado: segue enquanto a última página vier cheia.
  for (let page = expected + 1; pages.at(-1)?.length === PER_PAGE && page <= MAX_PAGES; page++) {
    pages.push(await fetchPage(transport, login, page));
  }
  return pages.flat();
}

async function fetchPage(
  transport: GithubTransport,
  login: string,
  page: number,
): Promise<RestRepo[]> {
  const path = `/users/${encodeURIComponent(login)}/repos?type=owner&sort=created&direction=asc&per_page=${PER_PAGE}&page=${page}`;
  const body = await transport.getJson(path);
  if (!Array.isArray(body)) {
    throw new GithubError(
      'invalid_response',
      `GET ${path}: esperado array, recebido ${preview(body)}.`,
    );
  }
  return body as RestRepo[];
}

/** Só repositórios próprios já forkados precisam da consulta; os demais ficam com `null`. */
async function attachFirstForks(
  transport: GithubTransport,
  login: string,
  repos: Repo[],
): Promise<Repo[]> {
  const forked = repos.filter((repo) => !repo.isFork && repo.forks > 0).map((repo) => repo.name);
  const batches = chunk(forked, FORK_BATCH);
  const results = await mapWithConcurrency(batches, CONCURRENCY, (names) =>
    fetchFirstForks(transport, login, names),
  );
  const firstForkByName = new Map(results.flat());
  return repos.map((repo) => ({ ...repo, firstForkAt: firstForkByName.get(repo.name) ?? null }));
}

async function fetchFirstForks(
  transport: GithubTransport,
  login: string,
  names: string[],
): Promise<Array<[string, string]>> {
  const data = (await transport.graphql(firstForksQuery(login, names), {})) as ForksPage;
  return names.flatMap((name, index): Array<[string, string]> => {
    const createdAt = data?.[`r${index}`]?.forks.nodes[0]?.createdAt;
    return createdAt ? [[name, createdAt]] : [];
  });
}
