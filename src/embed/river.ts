import { languageColor } from '../domain/language-colors.js';
import {
  OTHER_LANGUAGES,
  languageStreams,
  streamTotals,
  type LanguageStream,
  type LanguageStreams,
} from '../domain/language-streams.js';
import type { ProfileSnapshot } from '../domain/snapshot.js';
import {
  DEFAULT_RIVER_PALETTE,
  OTHER_COLOR,
  riverColors,
  type RiverPaletteId,
} from './palettes.js';
import type { Locale } from '../i18n/locale.js';
import { message, translate } from '../i18n/translate.js';
import type { Theme } from '../lib/theme.js';
import { escapeMarkup } from '../lib/escape.js';
import {
  REDUCED_MOTION_CSS,
  embedHeader,
  embedPalette,
  round,
  svgDocument,
  svgText,
  type EmbedPalette,
} from './svg-kit.js';

const WIDTH = 840;
const PLOT_LEFT = 64;
const PLOT_RIGHT = 716;
const CENTER_Y = 146;
const MAX_BAND_HEIGHT = 150;
const LABEL_GAP = 13;
const PERIOD_MS = 12000;
const REVEAL_MS = 3000;
/** Começa no meio do ciclo: o primeiro quadro já mostra o rio inteiro (ver trilha). */
const START_OFFSET_MS = PERIOD_MS / 2;
/** Nomes longos que não cabem à direita do rio. */
const SHORT_NAMES: Readonly<Record<string, string>> = { 'Jupyter Notebook': 'Jupyter' };

interface Band {
  stream: LanguageStream;
  lower: number[];
  upper: number[];
}

interface RiverContext {
  series: LanguageStreams;
  xs: number[];
  bands: Band[];
  palette: EmbedPalette;
  locale: Locale;
  /** Cor da faixa e da legenda de cada linguagem, conforme a paleta escolhida. */
  colorOf: (name: string) => string;
}

/**
 * Rio de linguagens: streamgraph simétrico dos repositórios próprios criados por linguagem
 * em cada ano, revelado da esquerda para a direita em loop.
 * @example renderRiver(snapshot, 'claro', 'en') // "<svg …>"
 */
export function renderRiver(
  snapshot: ProfileSnapshot,
  theme: Theme,
  locale: Locale,
  paletteId: RiverPaletteId = DEFAULT_RIVER_PALETTE,
): string {
  const series = padSingleYear(languageStreams(snapshot.timeline));
  const xs = columnsX(series.years.length);
  const context: RiverContext = {
    ...{ series, xs, palette: embedPalette(theme), locale },
    bands: stackBands(series),
    colorOf: streamColors(series, paletteId),
  };
  const legend = riverLegend(context);
  const height = 298 + legend.extraHeight;
  return svgDocument({
    ...{ width: WIDTH, height, palette: context.palette, style: riverStyle() },
    title: riverTitle(snapshot, series, locale),
    body: riverBody(snapshot, context) + legend.markup(height),
  });
}

function riverBody(snapshot: ProfileSnapshot, context: RiverContext): string {
  const bands = context.bands.map((band) => bandPath(band, context)).join('');
  return [
    riverHeader(snapshot, context),
    yearAxis(context),
    `<g class="reveal">${bands}</g>`,
    revealFront(context),
    endLabels(context),
  ].join('');
}

/**
 * Na paleta das linguagens cada faixa usa a cor do Linguist; nas outras, a cor vem da posição
 * da faixa no rio, e "Outras" fica sempre cinza.
 */
function streamColors(
  series: LanguageStreams,
  paletteId: RiverPaletteId,
): (name: string) => string {
  const colors = riverColors(paletteId);
  if (!colors) return languageColor;
  const names = series.streams
    .map((stream) => stream.name)
    .filter((name) => name !== OTHER_LANGUAGES);
  return (name) =>
    name === OTHER_LANGUAGES
      ? OTHER_COLOR
      : (colors[names.indexOf(name) % colors.length] ?? OTHER_COLOR);
}

/** Com um ano só não há curva: repete o ano para desenhar uma faixa reta. */
function padSingleYear(series: LanguageStreams): LanguageStreams {
  if (series.years.length !== 1) return series;
  return {
    years: [series.years[0] ?? 0, series.years[0] ?? 0],
    streams: series.streams.map((stream) => ({
      ...stream,
      values: [...stream.values, ...stream.values],
    })),
  };
}

function columnsX(count: number): number[] {
  const step = count > 1 ? (PLOT_RIGHT - PLOT_LEFT) / (count - 1) : 0;
  return Array.from({ length: count }, (_, index) => PLOT_LEFT + index * step);
}

/** Empilha as faixas a partir da base simétrica (silhueta centrada em `CENTER_Y`). */
function stackBands(series: LanguageStreams): Band[] {
  const totals = streamTotals(series);
  const unit = MAX_BAND_HEIGHT / Math.max(1, ...totals);
  let floor = totals.map((total) => CENTER_Y - (total * unit) / 2);
  return series.streams.map((stream) => {
    const lower = floor;
    const upper = lower.map((y, index) => y + (stream.values[index] ?? 0) * unit);
    floor = upper;
    return { stream, lower, upper };
  });
}

function riverTitle(snapshot: ProfileSnapshot, series: LanguageStreams, locale: Locale): string {
  const source = 'Rio de linguagens de {0}: repositórios criados por linguagem de {1} a {2}';
  const first = series.years[0] ?? '';
  const last = series.years.at(-1) ?? '';
  return message(source, locale, [snapshot.account.username, first, last]);
}

function riverStyle(): string {
  const revealPct = round((REVEAL_MS / PERIOD_MS) * 100);
  const span = PLOT_RIGHT - PLOT_LEFT;
  return `.reveal{animation:reveal ${PERIOD_MS}ms cubic-bezier(.4,0,.2,1) -${START_OFFSET_MS}ms infinite both}
@keyframes reveal{0%{clip-path:inset(0 100% 0 0);opacity:1}${revealPct}%{clip-path:inset(0 0 0 0);opacity:1}94%{clip-path:inset(0 0 0 0);opacity:1}100%{clip-path:inset(0 0 0 0);opacity:0}}
.front{animation:front ${PERIOD_MS}ms cubic-bezier(.4,0,.2,1) -${START_OFFSET_MS}ms infinite both}
@keyframes front{0%{transform:translateX(0);opacity:1}${revealPct}%{transform:translateX(${span}px);opacity:1}${round(revealPct + 3)}%,100%{transform:translateX(${span}px);opacity:0}}
.anim{opacity:0;animation:fade ${PERIOD_MS}ms ease-out infinite both}
@keyframes fade{0%{opacity:0}3%{opacity:1}94%{opacity:1}100%{opacity:0}}
${REDUCED_MOTION_CSS}`;
}

function riverHeader(snapshot: ProfileSnapshot, context: RiverContext): string {
  return embedHeader({
    ...{ title: translate('Rio de linguagens', context.locale), width: WIDTH },
    subtitle: translate('repositórios criados por ano', context.locale),
    ...{ right: snapshot.account.username, palette: context.palette },
  });
}

/** Um marcador por ano; com um ano só, `padSingleYear` duplicou a coluna e ela sai uma vez. */
function yearAxis(context: RiverContext): string {
  const { xs } = context;
  const totals = streamTotals(context.series);
  const roomy = (xs[1] ?? WIDTH) - (xs[0] ?? 0) >= 56;
  const unique = xs[0] === xs[1] ? xs.slice(0, 1) : xs;
  return unique
    .map((x, index) => yearMarker(x, index, roomy ? totals[index] : undefined, context))
    .join('');
}

function yearMarker(
  x: number,
  index: number,
  total: number | undefined,
  context: RiverContext,
): string {
  const { palette, series, locale } = context;
  const line = `<line x1="${round(x)}" y1="62" x2="${round(x)}" y2="226" stroke="${palette.border}" stroke-dasharray="2 4"/>`;
  const year = svgText({
    ...{ x, y: 246, size: 11.5, font: 'mono', weight: 700, anchor: 'middle' },
    ...{ fill: palette.text, content: String(series.years[index]) },
  });
  const count =
    total === undefined
      ? ''
      : svgText({
          ...{ x, y: 261, size: 10, font: 'mono', anchor: 'middle', fill: palette.faint },
          content: message('{0} repos', locale, [total]),
        });
  return `<g class="anim" style="animation-delay:${revealDelay(x)}ms">${line}${year}${count}</g>`;
}

/** Cada ano aparece quando a frente do rio chega nele. */
function revealDelay(x: number): number {
  return Math.round(((x - PLOT_LEFT) / (PLOT_RIGHT - PLOT_LEFT)) * REVEAL_MS) - START_OFFSET_MS;
}

function bandPath(band: Band, context: RiverContext): string {
  const { xs, palette, series, locale } = context;
  const top = curveThrough(xs, band.lower);
  const bottom = curveThrough([...xs].reverse(), [...band.upper].reverse());
  const d = `M${round(xs[0] ?? 0)},${round(band.lower[0] ?? 0)}${top}L${round(xs.at(-1) ?? 0)},${round(band.upper.at(-1) ?? 0)}${bottom}Z`;
  const values = band.stream.values
    .map((value, index) => `${series.years[index]}: ${value}`)
    .join(' · ');
  const tooltip = `<title>${escapeMarkup(`${displayName(band.stream.name, locale)} — ${values}`)}</title>`;
  return `<path d="${d}" fill="${context.colorOf(band.stream.name)}" stroke="${palette.background}" stroke-width="1.5" stroke-linejoin="round">${tooltip}</path>`;
}

/** Curvas com tangente horizontal em cada ano: suaves e sem passar dos valores reais. */
function curveThrough(xs: number[], ys: number[]): string {
  let path = '';
  for (let index = 1; index < xs.length; index += 1) {
    const [x0, y0, x1, y1] = [
      xs[index - 1] ?? 0,
      ys[index - 1] ?? 0,
      xs[index] ?? 0,
      ys[index] ?? 0,
    ];
    const middle = round((x0 + x1) / 2);
    path += `C${middle},${round(y0)} ${middle},${round(y1)} ${round(x1)},${round(y1)}`;
  }
  return path;
}

function revealFront(context: RiverContext): string {
  const line = `<rect x="${PLOT_LEFT - 1}" y="60" width="2" height="168" rx="1" fill="${context.palette.accent}" opacity=".8"/>`;
  return `<g class="front motion-only">${line}</g>`;
}

/** Rótulos à direita das faixas que chegam ao último ano, empurrados para não colidir. */
function endLabels(context: RiverContext): string {
  const last = context.xs.length - 1;
  let previous = -Infinity;
  const labels = context.bands
    .filter((band) => (band.upper[last] ?? 0) - (band.lower[last] ?? 0) > 0)
    .map((band) => {
      const middle = ((band.lower[last] ?? 0) + (band.upper[last] ?? 0)) / 2 + 4;
      previous = Math.max(middle, previous + LABEL_GAP);
      const name = displayName(band.stream.name, context.locale);
      return svgText({
        x: PLOT_RIGHT + 12,
        y: previous,
        size: 11,
        weight: 600,
        fill: context.palette.muted,
        content: name,
      });
    });
  return `<g class="anim" style="animation-delay:${REVEAL_MS - START_OFFSET_MS}ms">${labels.join('')}</g>`;
}

function displayName(name: string, locale: Locale): string {
  if (name === OTHER_LANGUAGES) return translate(OTHER_LANGUAGES, locale);
  return SHORT_NAMES[name] ?? (name.length > 14 ? `${name.slice(0, 13)}…` : name);
}

/** Legenda em linhas que quebram: a cor nunca é a única pista da linguagem. */
function riverLegend(context: RiverContext): {
  extraHeight: number;
  markup: (height: number) => string;
} {
  const rows = legendRows(context);
  const rowY = (height: number, index: number) => height - 13 - (rows.length - 1 - index) * 18;
  const markup = (height: number) =>
    rows.map((row, index) => legendRow(row, rowY(height, index), context)).join('');
  return { extraHeight: (rows.length - 1) * 18, markup };
}

type LegendItem = { name: string; x: number };

function legendRows(context: RiverContext): LegendItem[][] {
  const rows: LegendItem[][] = [];
  let current: LegendItem[] = [];
  let x = 24;
  for (const band of context.bands) {
    const width = displayName(band.stream.name, context.locale).length * 6.6 + 32;
    if (current.length && x + width > WIDTH - 24) {
      rows.push(current);
      current = [];
      x = 24;
    }
    current.push({ name: band.stream.name, x });
    x += width;
  }
  return [...rows, current];
}

function legendRow(row: LegendItem[], y: number, context: RiverContext): string {
  return row
    .map(({ name, x }) => {
      const swatch = `<rect x="${round(x)}" y="${y - 9}" width="10" height="10" rx="2" fill="${context.colorOf(name)}"/>`;
      const label = svgText({
        x: x + 15,
        y,
        size: 10.5,
        font: 'mono',
        fill: context.palette.muted,
        content: displayName(name, context.locale),
      });
      return swatch + label;
    })
    .join('');
}
