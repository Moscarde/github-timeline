import type { MonthlyContributions, OrgContribution } from '../domain/types.js';
import { mapWithConcurrency } from '../lib/concurrency.js';
import type { GithubTransport } from './client.js';
import { toMonthlyRow, toOrgContributions, type GraphqlYearContributions } from './mappers.js';
import { contributionsQuery } from './queries.js';

const CONCURRENCY = 10;

type YearPage = { user: { year: GraphqlYearContributions } | null };

export interface ContributionHistory {
  months: MonthlyContributions;
  orgContributions: OrgContribution[];
}

/**
 * Contribuições públicas por mês e commits em organizações, um ano por requisição.
 * @example await fetchContributionHistory(transport, 'torvalds', [2024, 2025])
 */
export async function fetchContributionHistory(
  transport: GithubTransport,
  username: string,
  years: number[],
): Promise<ContributionHistory> {
  const pages = await mapWithConcurrency(years, CONCURRENCY, async (year) => {
    const data = (await transport.graphql(contributionsQuery(year), { username })) as YearPage;
    return [year, data?.user?.year ?? null] as const;
  });
  const history: ContributionHistory = { months: {}, orgContributions: [] };
  for (const [year, collection] of pages) {
    if (!collection) continue;
    history.months[year] = toMonthlyRow(year, collection);
    history.orgContributions.push(...toOrgContributions(year, collection));
  }
  return history;
}
