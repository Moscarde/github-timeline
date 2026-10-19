import { formatInteger, monthNames } from '../domain/format.js';
import type { ProfileSnapshot } from '../domain/snapshot.js';
import type { Locale } from '../i18n/locale.js';
import { message, translate } from '../i18n/translate.js';
import type { Theme } from '../lib/theme.js';
import {
  REDUCED_MOTION_CSS,
  embedHeader,
  embedPalette,
  round,
  svgDocument,
  svgText,
  wrapWords,
  type EmbedPalette,
} from './svg-kit.js';
import {
  TRAIL_ROWS,
  trailLayout,
  type TrailColumn,
  type TrailLayout,
  type TrailYear,
} from './trail-layout.js';
import { trailScale } from './palettes.js';
import { DEFAULT_TRAIL_OPTIONS, type TrailOptions } from './trail-options.js';

const WIDTH = 840;
const TOP = 66;
/** Ciclo completo e tempo que o cometa leva para cruzar a grade. */
const PERIOD_MS = 9000;
const SWEEP_MS = 3900;
/**
 * Todo o ciclo começa adiantado em meio período: o primeiro quadro já mostra a carreira acesa
 * (é o que aparece em miniaturas e enquanto a página carrega) e o cometa passa depois.
 */
const START_OFFSET_MS = PERIOD_MS / 2;
const SQUARE_STAGGER_MS = 22;
/** Abaixo disso o ano usa fonte menor e perde a estrela de recorde. */
const MIN_LABEL_BLOCK = 60;
/** "2025 ★" e "2.730" lado a lado precisam de pelo menos isso (anos agrupados não cabem). */
const MIN_TOTAL_BLOCK = 96;
/** Largura média de um caractere em 10,5 px nas fontes do sistema, com folga. */
const TITLE_CHAR_WIDTH = 6.2;

interface TrailContext {
  layout: TrailLayout;
  palette: EmbedPalette;
  locale: Locale;
  base: number;
  msPerPx: number;
  /** Total e descrição de cada ano; desligado no estilo compacto. */
  details: boolean;
}

/** Títulos das eras só cabem em blocos largos e só aparecem no estilo completo. */
function showsTitles(context: TrailContext): boolean {
  return context.details && context.layout.showTitles;
}

/**
 * Trilha da carreira: uma coluna de quadrados por mês e um cometa que acende a carreira
 * inteira em loop. Animação só com CSS, que o GitHub mantém em SVG servido por `<img>`.
 * A paleta (`?paleta=`) troca a escala dos quadrados e a cor do cometa; o estilo compacto
 * (`?estilo=compacto`) tira total e descrição de cada ano.
 * @example renderTrail(snapshot, 'escuro', 'pt-BR', { palette: 'verde', style: 'compacto' })
 */
export function renderTrail(
  snapshot: ProfileSnapshot,
  theme: Theme,
  locale: Locale,
  options: Partial<TrailOptions> = {},
): string {
  const { palette, style } = { ...DEFAULT_TRAIL_OPTIONS, ...options };
  const layout = trailLayout(snapshot);
  const context: TrailContext = {
    ...{ layout, palette: { ...embedPalette(theme), ...trailScale(palette, theme) }, locale },
    base: TOP + TRAIL_ROWS * layout.pitch,
    msPerPx: layout.span > 0 ? SWEEP_MS / layout.span : 0,
    details: style === 'completo',
  };
  const height = context.base + (showsTitles(context) ? 100 : 56);
  const body = [
    trailHeader(snapshot, context),
    emptyGrid(context),
    litSquares(context),
    peakLabel(context),
    layout.years.map((year) => yearLabel(year, context)).join(''),
    comet(context),
    trailFooter(snapshot, context, height),
  ].join('');
  return svgDocument({
    ...{ width: WIDTH, height, palette: context.palette, body, style: trailStyle(layout) },
    title: trailTitle(snapshot, layout, locale),
  });
}

function trailTitle(snapshot: ProfileSnapshot, layout: TrailLayout, locale: Locale): string {
  const first = layout.years[0]?.year ?? '';
  const last = layout.years.at(-1)?.year ?? '';
  const total = formatInteger(layout.total, locale);
  const source = 'Trilha da carreira de {0}: {1} contribuições de {2} a {3}';
  return message(source, locale, [snapshot.account.username, total, first, last]);
}

function trailStyle(layout: TrailLayout): string {
  const sweepPct = round((SWEEP_MS / PERIOD_MS) * 100);
  const lit = `.anim{opacity:0;transform-box:fill-box;transform-origin:center;animation:lit ${PERIOD_MS}ms cubic-bezier(.2,.8,.2,1) infinite both}
@keyframes lit{0%{opacity:0;transform:scale(.3)}3%{opacity:1;transform:scale(1)}88%{opacity:1;transform:scale(1)}94%,100%{opacity:0;transform:scale(1)}}`;
  const comet = `.comet{animation:comet ${PERIOD_MS}ms linear -${START_OFFSET_MS}ms infinite both}
@keyframes comet{0%{transform:translateX(0);opacity:0}2%{opacity:1}${sweepPct}%{transform:translateX(${round(layout.span)}px);opacity:1}${round(sweepPct + 4)}%,100%{transform:translateX(${round(layout.span)}px);opacity:0}}`;
  return `${lit}\n${comet}\n${REDUCED_MOTION_CSS}`;
}

function trailHeader(snapshot: ProfileSnapshot, context: TrailContext): string {
  const { layout, locale } = context;
  const range = `${layout.years[0]?.year ?? ''}–${layout.years.at(-1)?.year ?? ''}`;
  const total = formatInteger(layout.total, locale);
  return embedHeader({
    ...{ title: snapshot.account.username, width: WIDTH, palette: context.palette },
    subtitle: translate('trilha no GitHub', locale),
    right: message('{0} contribuições · {1}', locale, [total, range]),
  });
}

/**
 * Grade vazia como `<pattern>`, um retângulo por ano: com um `<rect>` por célula o SVG da
 * trilha passava de 89 KB.
 */
function emptyGrid(context: TrailContext): string {
  const { layout, palette } = context;
  const cell = layout.pitch - 2;
  const pattern = `<defs><pattern id="cell" width="${layout.pitch}" height="${layout.pitch}" patternUnits="userSpaceOnUse"><rect width="${cell}" height="${cell}" rx="2" fill="${palette.levels[0]}"/></pattern></defs>`;
  const height = TRAIL_ROWS * layout.pitch;
  const blocks = layout.years.map(
    (year) =>
      `<rect transform="translate(${round(year.x)},${TOP})" width="${year.width}" height="${height}" fill="url(#cell)"/>`,
  );
  return pattern + blocks.join('') + futureVeil(context);
}

/** Meses depois da coleta ficam apagados por um véu na cor do fundo. */
function futureVeil(context: TrailContext): string {
  const { layout, palette } = context;
  return layout.columns
    .filter((column) => column.future)
    .map(
      (column) =>
        `<rect x="${round(column.x)}" y="${TOP}" width="${layout.pitch}" height="${TRAIL_ROWS * layout.pitch}" fill="${palette.background}" opacity=".65"/>`,
    )
    .join('');
}

function litSquares(context: TrailContext): string {
  const { layout, palette, base } = context;
  const cell = layout.pitch - 2;
  return layout.columns
    .map((column) => {
      const delay = columnDelay(column, context);
      const squares = Array.from({ length: column.squares }, (_, row) => {
        const style = ` class="anim" style="animation-delay:${delay + row * SQUARE_STAGGER_MS}ms"`;
        return square(
          column.x,
          base - (row + 1) * layout.pitch,
          cell,
          palette.levels[tier(row)],
          style,
        );
      });
      return `<g>${columnTooltip(column, context.locale)}${squares.join('')}</g>`;
    })
    .join('');
}

function square(x: number, y: number, size: number, fill: string, extra: string): string {
  return `<rect x="${round(x)}" y="${round(y)}" width="${size}" height="${size}" rx="2" fill="${fill}"${extra}/>`;
}

/** Faixas de cor por altura: o topo das colunas altas brilha mais. */
function tier(row: number): 1 | 2 | 3 | 4 {
  if (row < 2) return 1;
  if (row < 4) return 2;
  return row < 6 ? 3 : 4;
}

/** O atraso segue a posição x: cada coluna acende quando o cometa passa por ela. */
function columnDelay(column: { x: number }, context: TrailContext): number {
  const first = context.layout.columns[0]?.x ?? 0;
  return Math.round((column.x - first) * context.msPerPx) - START_OFFSET_MS;
}

function columnTooltip(column: TrailColumn, locale: Locale): string {
  const label = `${columnPeriod(column, locale)}: ${message('{0} contribuições', locale, [formatInteger(column.count, locale)])}`;
  return `<title>${label}</title>`;
}

function columnPeriod(column: TrailColumn, locale: Locale): string {
  const names = monthNames(locale);
  if (column.startMonth === column.endMonth) return `${names[column.startMonth]} ${column.year}`;
  return `${names[column.startMonth]}–${names[column.endMonth]} ${column.year}`;
}

function peakLabel(context: TrailContext): string {
  const { layout, palette, locale } = context;
  const peak = layout.peak;
  if (!peak) return '';
  const rightHalf = peak.x > WIDTH / 2;
  const text = message('pico · {0} em {1}', locale, [
    formatInteger(peak.count, locale),
    columnPeriod(peak, locale),
  ]);
  const label = svgText({
    ...{ x: rightHalf ? peak.x + layout.pitch - 2 : peak.x, y: TOP - 8, size: 10, font: 'mono' },
    ...{ anchor: rightHalf ? 'end' : 'start', fill: palette.accentInk, content: text },
  });
  return `<g class="anim" style="animation-delay:${columnDelay(peak, context)}ms">${label}</g>`;
}

function yearLabel(year: TrailYear, context: TrailContext): string {
  const { palette, base } = context;
  const compact = year.width < MIN_LABEL_BLOCK;
  const yearText = svgText({
    ...{ x: year.x, y: base + 22, size: compact ? 10 : 12, font: 'mono', weight: 700 },
    ...{ fill: year.isRecord ? palette.gold : palette.text },
    content: year.isRecord && !compact ? `${year.year} ★` : String(year.year),
  });
  const total = context.details && year.width >= MIN_TOTAL_BLOCK ? yearTotal(year, context) : '';
  const titles = showsTitles(context) ? eraTitle(year, context) : '';
  const delay = columnDelay(year, context);
  return `<g class="anim" style="animation-delay:${delay}ms">${yearText}${total}${titles}</g>`;
}

function yearTotal(year: TrailYear, context: TrailContext): string {
  return svgText({
    ...{ x: year.x + year.width - 2, y: context.base + 22, size: 11, font: 'mono' },
    ...{ anchor: 'end', fill: context.palette.faint },
    content: formatInteger(year.total, context.locale),
  });
}

function eraTitle(year: TrailYear, context: TrailContext): string {
  const maxChars = Math.floor(year.width / TITLE_CHAR_WIDTH);
  return wrapWords(year.title, maxChars, 3)
    .map((line, index) =>
      svgText({
        ...{ x: year.x, y: context.base + 40 + index * 13, size: 10.5 },
        ...{ fill: context.palette.muted, content: line },
      }),
    )
    .join('');
}

function comet(context: TrailContext): string {
  const { layout, palette } = context;
  const x = (layout.columns[0]?.x ?? 0) - 4;
  const height = TRAIL_ROWS * layout.pitch + 2;
  const line = `<rect x="${round(x)}" y="${TOP - 2}" width="2" height="${height}" rx="1" fill="${palette.accent}" opacity=".85"/>`;
  const head = `<circle cx="${round(x + 1)}" cy="${TOP - 4}" r="3.5" fill="${palette.accent}"/>`;
  return `<g class="comet motion-only">${line}${head}</g>`;
}

function trailFooter(snapshot: ProfileSnapshot, context: TrailContext, height: number): string {
  const { palette, locale } = context;
  const y = height - 14;
  const link = svgText({
    ...{ x: 24, y, size: 10, font: 'mono', fill: palette.faint },
    content: `github-timeline.frangolab.com/u/${snapshot.account.username}`,
  });
  return link + recordKey(y, context) + levelLegend(y, palette, locale);
}

function recordKey(y: number, context: TrailContext): string {
  if (!context.layout.years.some((year) => year.isRecord)) return '';
  const star = `<tspan fill="${context.palette.gold}">★</tspan>`;
  return svgText({
    ...{ x: WIDTH - 160, y, size: 10, font: 'mono', anchor: 'end', fill: context.palette.faint },
    raw: `${star}\u00a0${translate('ano recorde', context.locale)}`,
  });
}

function levelLegend(y: number, palette: EmbedPalette, locale: Locale): string {
  const label = (x: number, text: string, anchor: 'start' | 'end') =>
    svgText({ x, y, size: 10, font: 'mono', anchor, fill: palette.faint, content: text });
  const squares = ([1, 2, 3, 4] as const)
    .map((level, index) => square(WIDTH - 92 + index * 11, y - 8, 8, palette.levels[level], ''))
    .join('');
  return (
    label(WIDTH - 98, translate('menos', locale), 'end') +
    squares +
    label(WIDTH - 24, translate('mais', locale), 'end')
  );
}
