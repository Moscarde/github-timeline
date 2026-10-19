import { chronological, ownRepos, rankByCount } from './languages.js';
import type { Era } from './timeline.js';

/** Rótulo do agrupamento das linguagens fora do topo; o mesmo da barra de linguagens. */
export const OTHER_LANGUAGES = 'Outras';

/** Uma faixa do rio: repositórios próprios criados na linguagem, um valor por ano. */
export interface LanguageStream {
  name: string;
  values: number[];
}

/** Série completa do rio, alinhada aos anos da timeline. */
export interface LanguageStreams {
  years: number[];
  streams: LanguageStream[];
}

/**
 * Repositórios próprios criados por linguagem em cada ano da timeline. As `limit` linguagens
 * mais usadas ganham faixa própria, em ordem de chegada; o resto vai para "Outras".
 * Lê só o snapshot, sem coleta nova.
 * @example languageStreams(snapshot.timeline).streams[0] // { name: 'HTML', values: [5, 2, 0] }
 */
export function languageStreams(timeline: Era[], limit = 6): LanguageStreams {
  const perYear = timeline.map((era) => ownRepos(chronological(era.repos)));
  const allRepos = perYear.flat();
  const top = rankByCount(allRepos.map((repo) => repo.language))
    .slice(0, limit)
    .map(([name]) => name);
  const streams = arrivalOrder(
    top,
    allRepos.map((repo) => repo.language),
  ).map((name) => ({
    name,
    values: perYear.map((repos) => repos.filter((repo) => repo.language === name).length),
  }));
  const others = perYear.map(
    (repos) => repos.filter((repo) => repo.language && !top.includes(repo.language)).length,
  );
  const withOthers = others.some((count) => count > 0)
    ? [...streams, { name: OTHER_LANGUAGES, values: others }]
    : streams;
  return { years: timeline.map((era) => era.year), streams: withOthers };
}

/** Ordena as linguagens pela primeira aparição: o rio se lê da esquerda para a direita. */
function arrivalOrder(names: string[], languages: Array<string | null>): string[] {
  const firstSeen = (name: string) => languages.indexOf(name);
  return [...names].sort((a, b) => firstSeen(a) - firstSeen(b));
}

/**
 * Total de repositórios com linguagem em cada ano: a largura do rio.
 * @example streamTotals(languageStreams(timeline)) // [6, 7, 22]
 */
export function streamTotals(series: LanguageStreams): number[] {
  return series.years.map((_, index) =>
    series.streams.reduce((sum, stream) => sum + (stream.values[index] ?? 0), 0),
  );
}
