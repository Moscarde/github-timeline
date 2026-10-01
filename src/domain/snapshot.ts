import { buildAchievements, recordYear, type Achievement } from './achievements.js';
import { FRAMEWORK_CATALOG_VERSION } from './frameworks.js';
import { buildHeadline, type Headline } from './headline.js';
import {
  distinctLanguageCount,
  languageShares,
  ownRepos,
  type LanguageShare,
} from './languages.js';
import { yearOf } from './format.js';
import { buildTimeline, type Era } from './timeline.js';
import type {
  CollectedProfile,
  GithubAccount,
  MonthlyContributions,
  OrgPerson,
  Repo,
} from './types.js';

/**
 * Versão do formato derivado. Sobe quando uma regra ou o catálogo de frameworks muda;
 * snapshots de versão antiga são tratados como vencidos e recalculados.
 */
export const SNAPSHOT_VERSION = 5 * 100 + FRAMEWORK_CATALOG_VERSION;

const LANGUAGE_BAR_SIZE = 6;

export interface ProfileStats {
  firstYear: number | null;
  lastYear: number | null;
  activeYears: number;
  repos: number;
  ownRepos: number;
  forks: number;
  ownStars: number;
  /** Linguagens primárias distintas nos repositórios próprios. */
  languageCount: number;
  topRepo: { name: string; stars: number } | null;
  recordYear: number | null;
}

/** Resultado derivado e salvo (§3, "Snapshot"); tudo que as páginas, card e badge leem. */
export interface ProfileSnapshot {
  version: number;
  generatedAt: string;
  account: GithubAccount;
  stats: ProfileStats;
  headline: Headline;
  languages: LanguageShare[];
  achievements: Achievement[];
  timeline: Era[];
  months: MonthlyContributions;
  /** Organizações não têm timeline: a página lista quem mais contribui (§6). */
  people: OrgPerson[];
}

/**
 * Deriva o snapshot completo a partir da coleta.
 * @example const snapshot = deriveSnapshot(collected, new Date());
 */
export function deriveSnapshot(collected: CollectedProfile, now: Date): ProfileSnapshot {
  const stats = buildStats(collected.repos);
  return {
    version: SNAPSHOT_VERSION,
    generatedAt: now.toISOString(),
    account: collected.account,
    stats,
    headline: buildHeadline({
      repos: collected.repos,
      orgContributions: collected.orgContributions,
      activeYears: stats.activeYears,
    }),
    languages: languageShares(ownRepos(collected.repos), LANGUAGE_BAR_SIZE),
    achievements: buildAchievements(collected.repos, now),
    timeline: buildTimeline({ ...collected, recordYear: stats.recordYear }),
    months: collected.months,
    people: collected.people ?? [],
  };
}

/**
 * Indicadores do resumo. "Anos de atividade" vai do primeiro ao último ano de criação de
 * repositórios, inclusive; é o "N anos" da manchete (ex.: tj, 2008–2020 → 13).
 * @example buildStats(repos).activeYears // 16
 */
export function buildStats(repos: Repo[]): ProfileStats {
  const years = repos.map((repo) => yearOf(repo.createdAt)).sort((a, b) => a - b);
  const own = ownRepos(repos);
  const top = [...own].sort((a, b) => b.stars - a.stars)[0];
  const firstYear = years[0] ?? null;
  const lastYear = years[years.length - 1] ?? null;
  return {
    firstYear,
    lastYear,
    activeYears: firstYear !== null && lastYear !== null ? lastYear - firstYear + 1 : 0,
    repos: repos.length,
    ownRepos: own.length,
    forks: repos.length - own.length,
    ownStars: own.reduce((sum, repo) => sum + repo.stars, 0),
    languageCount: distinctLanguageCount(own),
    topRepo: top && top.stars > 0 ? { name: top.name, stars: top.stars } : null,
    recordYear: recordYear(repos),
  };
}
