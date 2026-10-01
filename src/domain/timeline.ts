import { joinPt, plural, yearOf } from './format.js';
import { knownLanguageNames } from './language-colors.js';
import { ownRepos, rankByCount } from './languages.js';
import type { MonthlyContributions, Ranked, Repo } from './types.js';

export interface EraSummary {
  repoCount: number;
  forkCount: number;
  topLanguage: { name: string; count: number; of: number } | null;
  topTopics: string[];
  mostStarred: { name: string; stars: number } | null;
  contributions: number | null;
}

/** Capítulo da linha do tempo: um ano de criação de repositórios. */
export interface Era {
  year: number;
  title: string;
  isRecord: boolean;
  summary: EraSummary;
  newLanguages: string[];
  newTopics: string[];
  /** Repositórios do ano ordenados por score; a página mostra os 6 primeiros. */
  repos: Repo[];
  /** Nome do mais estrelado do ano, que ocupa a largura toda. */
  mostStarredName: string | null;
}

export interface TimelineInput {
  repos: Repo[];
  months: MonthlyContributions;
  recordYear: number | null;
}

const TITLE_ITEMS = 3;
const NEW_TOPICS_SHOWN = 12;
const TOP_TOPICS_SHOWN = 4;
/** Linguagem nova pesa um pouco mais que topic com a mesma frequência. */
const NEW_LANGUAGE_BONUS = 0.5;

/**
 * Score de destaque (regra da v1): forks e arquivados perdem pontos. Stars de forks não
 * contam em nenhuma métrica do projeto: não refletem o trabalho do perfil.
 * @example repoScore(repo) > repoScore(otherRepo)
 */
export function repoScore(repo: Repo): number {
  return (
    (repo.isFork ? 0 : repo.stars * 3) +
    repo.forks * 2 +
    (repo.description ? 2 : 0) +
    repo.topics.length +
    (repo.homepage ? 1 : 0) +
    Math.log10(1 + repo.sizeKb) -
    (repo.isFork ? 3 : 0) -
    (repo.archived ? 1 : 0)
  );
}

/**
 * Anos com repositórios criados ou contribuições, em ordem crescente.
 * @example activeYears(repos, months) // [2014, 2015, 2017]
 */
export function activeYears(repos: Repo[], months: MonthlyContributions): number[] {
  const years = new Set(repos.map((repo) => yearOf(repo.createdAt)));
  for (const [year, row] of Object.entries(months)) {
    if (row.some((count) => count > 0)) years.add(Number(year));
  }
  return [...years].sort((a, b) => a - b);
}

/**
 * Monta os capítulos da linha do tempo (§4.3).
 * @example buildTimeline({ repos, months, recordYear: 2019 })[0].title // "Começo com Python"
 */
export function buildTimeline(input: TimelineInput): Era[] {
  const years = activeYears(input.repos, input.months);
  const seen = createSeenTerms();
  return years.map((year) => {
    const repos = input.repos.filter((repo) => yearOf(repo.createdAt) === year);
    return buildEra(year, repos, seen, input, year === years[0]);
  });
}

function buildEra(
  year: number,
  repos: Repo[],
  seen: SeenTerms,
  input: TimelineInput,
  isFirst: boolean,
): Era {
  const own = ownRepos(repos);
  const languages = rankByCount(own.map((repo) => repo.language));
  const topics = rankByCount(own.flatMap((repo) => repo.topics));
  const [newLanguages, newTopics] = takeNew(languages, topics, seen);
  const ranked = [...repos].sort((a, b) => repoScore(b) - repoScore(a));
  return {
    year,
    title: eraTitle(repos, languages, newLanguages, newTopics, isFirst),
    isRecord: year === input.recordYear,
    summary: summarize(repos, languages, topics, input.months[year]),
    newLanguages: newLanguages.map(([name]) => name),
    newTopics: newTopics.slice(0, NEW_TOPICS_SHOWN).map(([name]) => name),
    repos: ranked,
    mostStarredName: mostStarred(own)?.name ?? null,
  };
}

/** Termos já vistos em anos anteriores, normalizados. */
interface SeenTerms {
  languages: Set<string>;
  /** Topics vistos e nomes de linguagem: topics iguais a uma linguagem não contam. */
  topics: Set<string>;
}

function createSeenTerms(): SeenTerms {
  return { languages: new Set(), topics: new Set(knownLanguageNames().map(normalizeTerm)) };
}

/** Separa linguagens e topics que aparecem pela primeira vez e os marca como vistos. */
function takeNew(languages: Ranked, topics: Ranked, seen: SeenTerms): [Ranked, Ranked] {
  const newLanguages = languages.filter(([name]) => !seen.languages.has(normalizeTerm(name)));
  for (const [name] of languages) {
    seen.languages.add(normalizeTerm(name));
    seen.topics.add(normalizeTerm(name));
  }
  const newTopics = topics.filter(([name]) => !seen.topics.has(normalizeTerm(name)));
  for (const [name] of topics) seen.topics.add(normalizeTerm(name));
  return [newLanguages, newTopics];
}

function eraTitle(
  repos: Repo[],
  languages: Ranked,
  newLanguages: Ranked,
  newTopics: Ranked,
  isFirst: boolean,
): string {
  const weighted: Ranked = newLanguages.map(([name, count]) => [name, count + NEW_LANGUAGE_BONUS]);
  const fresh = [...weighted, ...newTopics]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TITLE_ITEMS)
    .map(([name]) => name);
  if (!repos.length) return 'Sem repositórios novos';
  if (fresh.length) return `${isFirst ? 'Começo com' : 'Entram'} ${joinPt(fresh)}`;
  if (languages[0]) return `Consolidação em ${languages[0][0]}`;
  return `${plural(repos.length, 'repositório', 'repositórios')} sem linguagem detectada`;
}

function summarize(
  repos: Repo[],
  languages: Ranked,
  topics: Ranked,
  monthRow: number[] | undefined,
): EraSummary {
  const own = ownRepos(repos);
  const best = mostStarred(own);
  const top = languages[0];
  return {
    repoCount: repos.length,
    forkCount: repos.length - own.length,
    topLanguage: top ? { name: top[0], count: top[1], of: own.length } : null,
    topTopics: topics.slice(0, TOP_TOPICS_SHOWN).map(([name]) => name),
    mostStarred: best ? { name: best.name, stars: best.stars } : null,
    contributions: monthRow ? monthRow.reduce((sum, count) => sum + count, 0) : null,
  };
}

function mostStarred(own: Repo[]): Repo | null {
  const best = [...own].sort((a, b) => b.stars - a.stars)[0];
  return best && best.stars > 0 ? best : null;
}

function normalizeTerm(term: string): string {
  return term.toLowerCase().replace(/[^a-z0-9+#]/g, '');
}
