const RATE_LIMIT_FIELDS = 'rateLimit { limit remaining resetAt }';

/**
 * Data do fork mais antigo de cada repositório, um alias por repositório.
 * Fica fora da listagem porque `forks(first: 1)` por nó custa ~4 s por página de 100.
 * @example firstForksQuery('torvalds', ['linux', 'subsurface'])
 */
export function firstForksQuery(owner: string, names: string[]): string {
  const aliases = names.map(
    (name, index) =>
      `r${index}: repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}) { forks(first: 1, orderBy: { field: CREATED_AT, direction: ASC }) { nodes { createdAt } } }`,
  );
  return `query {\n  ${RATE_LIMIT_FIELDS}\n  ${aliases.join('\n  ')}\n}`;
}

/**
 * Contribuições de um ano: a API limita cada `contributionsCollection` a 1 ano, e um ano por
 * requisição permite paralelizar (6 anos em série levam ~9 s; em paralelo, ~3 s).
 * @example contributionsQuery(2024)
 */
export function contributionsQuery(year: number): string {
  return `query($login: String!) {
  ${RATE_LIMIT_FIELDS}
  user(login: $login) {
    year: contributionsCollection(from: "${year}-01-01T00:00:00Z", to: "${year}-12-31T23:59:59Z") {
      contributionCalendar { weeks { contributionDays { date contributionCount } } }
      commitContributionsByRepository(maxRepositories: 100) {
        repository { nameWithOwner owner { __typename } primaryLanguage { name } }
        contributions { totalCount }
      }
    }
  }
}`;
}
