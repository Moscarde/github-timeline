import { formatCompact, plural, yearOf } from './format.js';
import { frameworksOf } from './frameworks.js';
import { distinctLanguageCount, ownRepos, predominantLanguage, rankByCount } from './languages.js';
import type { OrgContribution, Ranked, Repo } from './types.js';

export type HeadlineForm = 'estrela' | 'transicao' | 'poliglota' | 'fiel';

export interface Headline {
  form: HeadlineForm;
  /** Fecho da manchete, ex.: "De Ruby a Go." */
  closing: string;
  /** "N anos. M repositórios." + fecho, usado na página. */
  full: string;
  /** "N anos de código." + fecho, usado no card. */
  short: string;
}

export interface HeadlineInput {
  repos: Repo[];
  orgContributions: OrgContribution[];
  activeYears: number;
}

const STAR_MIN = 1000;
const STAR_SHARE_MIN = 0.4;
const POLYGLOT_MIN = 6;
const WINDOW_YEARS = 2;
const FRAMEWORK_MIN_REPOS = 2;

/**
 * Manchete do resumo (§4.1): vale a primeira forma cuja condição é verdadeira.
 * @example buildHeadline({ repos, orgContributions, activeYears: 13 }).full
 * // "13 anos. 296 repositórios. De Ruby a Go."
 */
export function buildHeadline(input: HeadlineInput): Headline {
  const own = ownRepos(input.repos);
  const [form, closing] = pickClosing(own, input.orgContributions);
  const years = plural(input.activeYears, 'ano', 'anos');
  return {
    form,
    closing,
    full: `${years}. ${plural(input.repos.length, 'repositório', 'repositórios')}. ${closing}`,
    short: `${years} de código. ${closing}`,
  };
}

function pickClosing(own: Repo[], org: OrgContribution[]): [HeadlineForm, string] {
  const star = starClosing(own);
  if (star) return ['estrela', star];
  const transition = transitionClosing(own, org);
  if (transition) return ['transicao', transition];
  const polyglot = polyglotClosing(own);
  if (polyglot) return ['poliglota', polyglot];
  return ['fiel', loyalClosing(own)];
}

function starClosing(own: Repo[]): string | null {
  const total = own.reduce((sum, repo) => sum + repo.stars, 0);
  const top = [...own].sort((a, b) => b.stars - a.stars)[0];
  if (!top || top.stars < STAR_MIN || top.stars < total * STAR_SHARE_MIN) return null;
  return `${formatCompact(top.stars)} ★ em ${top.name}.`;
}

/**
 * B é o primeiro candidato que difere de A: framework novo, linguagem recente ou linguagem
 * das contribuições em organizações. Sem o último, quem publica o trabalho principal numa
 * organização (ex.: yyx990803 em `vuejs`) cairia em "Fiel".
 */
function transitionClosing(own: Repo[], org: OrgContribution[]): string | null {
  const years = yearsWithLanguage(own);
  if (years.length < WINDOW_YEARS) return null;
  const early = years.slice(0, WINDOW_YEARS);
  const recent = years.slice(-WINDOW_YEARS);
  const from = predominantLanguage(reposCreatedIn(own, early));
  const candidates = [
    newFramework(own, recent),
    predominantLanguage(reposCreatedIn(own, recent)),
    orgLanguage(org),
  ];
  const to = candidates.find((candidate) => candidate && candidate !== from);
  return from && to ? `De ${from} a ${to}.` : null;
}

function polyglotClosing(own: Repo[]): string | null {
  const count = distinctLanguageCount(own);
  if (count < POLYGLOT_MIN) return null;
  return `${count} linguagens, ${predominantLanguage(own)} primeiro.`;
}

function loyalClosing(own: Repo[]): string {
  const language = predominantLanguage(own);
  const sinceRepo = [...own]
    .filter((repo) => !language || repo.language === language)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
  const since = sinceRepo ? yearOf(sinceRepo.createdAt) : null;
  if (!language) return since ? `Desde ${since}.` : 'A história está começando.';
  return `Fiel ao ${language} desde ${since}.`;
}

function yearsWithLanguage(own: Repo[]): number[] {
  const years = own.filter((repo) => repo.language).map((repo) => yearOf(repo.createdAt));
  return [...new Set(years)].sort((a, b) => a - b);
}

function reposCreatedIn(own: Repo[], years: number[]): Repo[] {
  return own.filter((repo) => years.includes(yearOf(repo.createdAt)));
}

/**
 * Framework do catálogo que aparece pela primeira vez no período recente, em ≥ 2 repositórios.
 * Desempate: mais repositórios recentes, primeiro ano de aparição, nome de exibição.
 */
function newFramework(own: Repo[], recentYears: number[]): string | null {
  const firstSeen = frameworkFirstYears(own);
  const recentCounts = rankByCount(
    reposCreatedIn(own, recentYears).flatMap((repo) => frameworksOf(repo.topics)),
  );
  const qualified = recentCounts.filter(
    ([name, count]) =>
      count >= FRAMEWORK_MIN_REPOS && recentYears.includes(firstSeen.get(name) ?? NaN),
  );
  return sortFrameworks(qualified, firstSeen)[0]?.[0] ?? null;
}

function frameworkFirstYears(own: Repo[]): Map<string, number> {
  const firstSeen = new Map<string, number>();
  for (const repo of own) {
    const year = yearOf(repo.createdAt);
    for (const name of frameworksOf(repo.topics)) {
      firstSeen.set(name, Math.min(year, firstSeen.get(name) ?? year));
    }
  }
  return firstSeen;
}

function sortFrameworks(ranked: Ranked, firstSeen: Map<string, number>): Ranked {
  return [...ranked].sort(
    (a, b) =>
      b[1] - a[1] ||
      (firstSeen.get(a[0]) ?? 0) - (firstSeen.get(b[0]) ?? 0) ||
      a[0].localeCompare(b[0]),
  );
}

/** Linguagem com mais commits em organizações nos 2 anos-calendário até a última contribuição. */
function orgLanguage(org: OrgContribution[]): string | null {
  const lastYear = Math.max(...org.map((entry) => entry.year));
  const recent = org.filter((entry) => entry.year > lastYear - WINDOW_YEARS);
  const commits = new Map<string, number>();
  for (const entry of recent) {
    if (entry.language)
      commits.set(entry.language, (commits.get(entry.language) ?? 0) + entry.commits);
  }
  const ranked = [...commits].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return ranked[0]?.[0] ?? null;
}
