import type { Ranked, Repo } from './types.js';

/**
 * Conta ocorrências não vazias e ordena por frequência. Empates mantêm a ordem da primeira
 * ocorrência: com repositórios em ordem cronológica, vence quem chegou antes
 * (ex.: karpathy, Python 3 × JavaScript 3 nos 2 primeiros anos → Python).
 * @example rankByCount(['Go', 'Rust', 'Go']) // [['Go', 2], ['Rust', 1]]
 */
export function rankByCount(values: Array<string | null | undefined>): Ranked {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1]);
}

/** Repositórios criados pelo perfil, sem forks. */
export function ownRepos(repos: Repo[]): Repo[] {
  return repos.filter((repo) => !repo.isFork);
}

/**
 * Linguagem primária mais frequente nos repositórios informados.
 * @example predominantLanguage(ownRepos(repos)) // "Python"
 */
export function predominantLanguage(repos: Repo[]): string | null {
  return rankByCount(chronological(repos).map((repo) => repo.language))[0]?.[0] ?? null;
}

/** Cópia ordenada por data de criação, a ordem que decide empates. */
export function chronological(repos: Repo[]): Repo[] {
  return [...repos].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Quantidade de linguagens primárias distintas. */
export function distinctLanguageCount(repos: Repo[]): number {
  return new Set(repos.map((repo) => repo.language).filter(Boolean)).size;
}

/** Fatia da barra de linguagens. */
export interface LanguageShare {
  name: string;
  count: number;
  ratio: number;
}

/**
 * Barra de linguagens dos repositórios próprios: as `limit` maiores e o resto em "Outras".
 * @example languageShares(ownRepos(repos), 6)
 */
export function languageShares(repos: Repo[], limit: number): LanguageShare[] {
  const ranked = rankByCount(chronological(repos).map((repo) => repo.language));
  const total = ranked.reduce((sum, [, count]) => sum + count, 0);
  if (total === 0) return [];
  const top = ranked.slice(0, limit);
  const rest = total - top.reduce((sum, [, count]) => sum + count, 0);
  const shares = top.map(([name, count]) => ({ name, count, ratio: count / total }));
  return rest > 0 ? [...shares, { name: 'Outras', count: rest, ratio: rest / total }] : shares;
}
