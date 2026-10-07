import type { Locale } from '../i18n/locale.js';
import { translate } from '../i18n/translate.js';
import type { ProfileSnapshot, ProfileStats } from '../domain/snapshot.js';
import { escapeMarkup } from '../lib/escape.js';

const LABEL = 'github timeline';
const NOT_FOUND = 'não encontrado';
const HEIGHT = 22;
const PADDING = 8;
/** JetBrains Mono tem avanço de 0,6em; `textLength` segura a largura se a fonte faltar. */
const CHAR_WIDTH = 7.2;
const FONT_FAMILY = "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

const COLORS = {
  label: { fill: '#30363d', text: '#e6edf3' },
  value: { fill: '#238636', text: '#ffffff' },
  missing: { fill: '#6e7781', text: '#ffffff' },
} as const;

/**
 * Valor do badge (§5.2): intervalo de anos e repositórios.
 * @example badgeValue(stats) // "2014–2026 · 97 repos"
 */
export function badgeValue(stats: ProfileStats): string {
  const { firstYear, lastYear, repos } = stats;
  const span = firstYear === lastYear ? `${firstYear ?? '—'}` : `${firstYear}–${lastYear}`;
  return `${span} · ${repos} ${repos === 1 ? 'repo' : 'repos'}`;
}

/**
 * Texto completo do badge, usado no `aria-label` e no `<title>`.
 * @example badgeLabel(snapshot, locale) // "github timeline: 2014–2026 · 97 repos"
 */
export function badgeLabel(snapshot: ProfileSnapshot | null, locale: Locale = 'pt-BR'): string {
  return `${LABEL}: ${snapshot ? badgeValue(snapshot.stats) : translate(NOT_FOUND, locale)}`;
}

/**
 * SVG do badge em dois segmentos. Sem snapshot, o segmento da direita fica cinza com
 * "não encontrado".
 * @example renderBadge(snapshot)
 */
export function renderBadge(snapshot: ProfileSnapshot | null, locale: Locale = 'pt-BR'): string {
  const value = snapshot ? badgeValue(snapshot.stats) : translate(NOT_FOUND, locale);
  const leftWidth = segmentWidth(LABEL);
  const rightWidth = segmentWidth(value);
  const width = leftWidth + rightWidth;
  const right = snapshot ? COLORS.value : COLORS.missing;
  const title = escapeMarkup(badgeLabel(snapshot, locale));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${HEIGHT}" viewBox="0 0 ${width} ${HEIGHT}" role="img" aria-label="${title}">
<title>${title}</title>
<clipPath id="r"><rect width="${width}" height="${HEIGHT}" rx="4"/></clipPath>
<g clip-path="url(#r)">
<rect width="${leftWidth}" height="${HEIGHT}" fill="${COLORS.label.fill}"/>
<rect x="${leftWidth}" width="${rightWidth}" height="${HEIGHT}" fill="${right.fill}"/>
</g>
<g font-family="${FONT_FAMILY}" font-size="12" font-weight="500">
${segmentText(LABEL, 0, COLORS.label.text)}
${segmentText(value, leftWidth, right.text)}
</g>
</svg>`;
}

function segmentWidth(text: string): number {
  return Math.ceil(text.length * CHAR_WIDTH + PADDING * 2);
}

function segmentText(text: string, x: number, color: string): string {
  const length = (text.length * CHAR_WIDTH).toFixed(1);
  return `<text x="${x + PADDING}" y="15" fill="${color}" textLength="${length}" lengthAdjust="spacingAndGlyphs">${escapeMarkup(text)}</text>`;
}
