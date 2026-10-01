import { formatMonthYear, formatInteger, yearOf } from './format.js';
import { distinctLanguageCount, ownRepos } from './languages.js';
import type { Repo } from './types.js';

export type AchievementId =
  | 'primeiro-repo'
  | 'estrelado'
  | 'stars-100'
  | 'stars-1000'
  | 'primeiro-fork'
  | 'poliglota'
  | 'ano-recorde'
  | 'uma-decada'
  | 'topics-50';

export interface Achievement {
  id: AchievementId;
  title: string;
  icon: string;
  color: string;
  unlocked: boolean;
  /** Texto exibido: detalhe quando desbloqueada, progresso quando bloqueada. */
  detail: string;
}

interface AchievementContext {
  all: Repo[];
  own: Repo[];
  now: Date;
}

interface AchievementRule {
  id: AchievementId;
  title: string;
  icon: string;
  color: string;
  evaluate: (context: AchievementContext) => { unlocked: boolean; detail: string };
}

const POLYGLOT_MIN = 5;
const DECADE_YEARS = 10;
const TOPICS_MIN = 50;

/** Catálogo das conquistas (§4.2): regra, ícone, cor e texto de progresso. */
const RULES: AchievementRule[] = [
  {
    id: 'primeiro-repo',
    title: 'Primeiro repo',
    icon: 'repo',
    color: 'green',
    evaluate: firstRepo,
  },
  { id: 'estrelado', title: 'Estrelado', icon: 'star', color: 'yellow', evaluate: starsAtLeast(1) },
  {
    id: 'stars-100',
    title: '100 stars',
    icon: 'star',
    color: 'orange',
    evaluate: starsAtLeast(100),
  },
  {
    id: 'stars-1000',
    title: '1.000 stars',
    icon: 'star',
    color: 'red',
    evaluate: starsAtLeast(1000),
  },
  { id: 'primeiro-fork', title: 'Primeiro fork', icon: 'fork', color: 'blue', evaluate: firstFork },
  { id: 'poliglota', title: 'Poliglota', icon: 'code', color: 'purple', evaluate: polyglot },
  {
    id: 'ano-recorde',
    title: 'Ano recorde',
    icon: 'flame',
    color: 'green',
    evaluate: recordYearRule,
  },
  { id: 'uma-decada', title: 'Uma década', icon: 'clock', color: 'slate', evaluate: decade },
  { id: 'topics-50', title: '50 topics', icon: 'tag', color: 'teal', evaluate: topics },
];

/**
 * Conquistas calculadas só com os dados da coleta, sem chamadas extras.
 * @example buildAchievements(repos, new Date()).filter((a) => a.unlocked)
 */
export function buildAchievements(repos: Repo[], now: Date): Achievement[] {
  const context = { all: repos, own: ownRepos(repos), now };
  return RULES.map(({ evaluate, ...meta }) => ({ ...meta, ...evaluate(context) }));
}

/**
 * Ano com mais repositórios criados; em empate, o mais antigo.
 * @example recordYear(repos) // 2019
 */
export function recordYear(repos: Repo[]): number | null {
  const counts = new Map<number, number>();
  for (const repo of repos) {
    const year = yearOf(repo.createdAt);
    counts.set(year, (counts.get(year) ?? 0) + 1);
  }
  const ranked = [...counts].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  return ranked[0]?.[0] ?? null;
}

function oldest(repos: Repo[]): Repo | undefined {
  return [...repos].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
}

function firstRepo({ all }: AchievementContext) {
  const repo = oldest(all);
  if (!repo) return { unlocked: false, detail: 'nenhum repositório público' };
  return { unlocked: true, detail: `${repo.name} · ${formatMonthYear(repo.createdAt)}` };
}

function starsAtLeast(minimum: number) {
  return ({ own }: AchievementContext) => {
    const repo = oldest(own.filter((candidate) => candidate.stars >= minimum));
    if (repo) return { unlocked: true, detail: repo.name };
    const best = Math.max(0, ...own.map((candidate) => candidate.stars));
    return { unlocked: false, detail: `${formatInteger(best)} de ${formatInteger(minimum)} ★` };
  };
}

function firstFork({ own }: AchievementContext) {
  const dates = own.map((repo) => repo.firstForkAt).filter((date): date is string => !!date);
  const first = dates.sort()[0];
  if (!first) return { unlocked: false, detail: 'nenhum fork ainda' };
  return { unlocked: true, detail: formatMonthYear(first) };
}

function polyglot({ own }: AchievementContext) {
  const count = distinctLanguageCount(own);
  if (count >= POLYGLOT_MIN) return { unlocked: true, detail: `${count} linguagens` };
  return { unlocked: false, detail: `${count} de ${POLYGLOT_MIN} linguagens` };
}

function recordYearRule({ all }: AchievementContext) {
  const year = recordYear(all);
  return year ? { unlocked: true, detail: String(year) } : { unlocked: false, detail: '—' };
}

function decade({ all, now }: AchievementContext) {
  const repo = oldest(all);
  if (!repo) return { unlocked: false, detail: `faltam ${DECADE_YEARS} anos` };
  const elapsed = (now.getTime() - Date.parse(repo.createdAt)) / (365.25 * 24 * 3600 * 1000);
  if (elapsed >= DECADE_YEARS) return { unlocked: true, detail: `desde ${yearOf(repo.createdAt)}` };
  const left = Math.ceil(DECADE_YEARS - elapsed);
  return { unlocked: false, detail: left === 1 ? 'falta 1 ano' : `faltam ${left} anos` };
}

function topics({ own }: AchievementContext) {
  const count = new Set(own.flatMap((repo) => repo.topics.map((t) => t.toLowerCase()))).size;
  if (count >= TOPICS_MIN) return { unlocked: true, detail: `${count} topics` };
  return { unlocked: false, detail: `${count} de ${TOPICS_MIN}` };
}
