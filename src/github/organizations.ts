import type { OrgPerson } from '../domain/types.js';
import { mapWithConcurrency } from '../lib/concurrency.js';
import type { GithubTransport } from './client.js';

const TOP_REPOS = 5;
const CONTRIBUTORS_PER_REPO = 20;
const PEOPLE_SHOWN = 5;

interface SearchRepositories {
  items?: Array<{ full_name: string }>;
}

interface RestContributor {
  login: string;
  avatar_url: string;
  type: string;
  contributions: number;
}

/**
 * Maiores contribuidores dos repositórios públicos mais estrelados de uma organização.
 * Bots ficam de fora: a lista leva a timelines de pessoas.
 * @example await fetchOrganizationPeople(transport, 'vuejs') // [{ username: 'yyx990803', … }]
 */
export async function fetchOrganizationPeople(
  transport: GithubTransport,
  org: string,
): Promise<OrgPerson[]> {
  const query = new URLSearchParams({
    q: `org:${org}`,
    sort: 'stars',
    per_page: String(TOP_REPOS),
  });
  const search = (await transport.getJson(`/search/repositories?${query}`)) as SearchRepositories;
  const repos = (search?.items ?? []).map((item) => item.full_name);
  const lists = await mapWithConcurrency(repos, 3, (repo) => contributorsOf(transport, repo));
  return rankPeople(lists.flat());
}

async function contributorsOf(transport: GithubTransport, repo: string) {
  const path = `/repos/${repo}/contributors?per_page=${CONTRIBUTORS_PER_REPO}`;
  const raw = await transport.getJson(path);
  return Array.isArray(raw) ? (raw as RestContributor[]) : [];
}

/**
 * Soma as contribuições por username e devolve as maiores.
 * @example rankPeople([{ username: 'a', contributions: 3, … }])[0].contributions // 3
 */
export function rankPeople(contributors: RestContributor[]): OrgPerson[] {
  const people = new Map<string, OrgPerson>();
  for (const person of contributors) {
    if (person.type !== 'User') continue;
    const current = people.get(person.login.toLowerCase());
    const contributions = (current?.contributions ?? 0) + person.contributions;
    people.set(person.login.toLowerCase(), {
      username: person.login,
      avatarUrl: person.avatar_url,
      contributions,
    });
  }
  return [...people.values()]
    .sort((a, b) => b.contributions - a.contributions || a.username.localeCompare(b.username))
    .slice(0, PEOPLE_SHOWN);
}
