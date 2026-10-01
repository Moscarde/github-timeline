import type { ProfileSnapshot } from '../domain/snapshot.js';
import { escapeMarkup } from '../lib/escape.js';
import type { Theme } from '../lib/theme.js';
import { BRAND, SYMBOL_VIEWBOX, symbolPaths } from './symbol.js';

interface BadgePalette {
  background: string;
  border: string;
  text: string;
  ink: string;
}

const PALETTES: Record<Theme | 'cinza', BadgePalette> = {
  claro: { background: BRAND.white, border: BRAND.line, text: BRAND.navy, ink: BRAND.navy },
  escuro: { background: BRAND.navy, border: BRAND.slate, text: BRAND.light, ink: BRAND.white },
  cinza: { background: BRAND.line, border: BRAND.slate2, text: BRAND.slate, ink: BRAND.slate },
};

const HEIGHT = 28;
const SYMBOL_WIDTH = 44;
/** Largura média de um caractere a 12px nas fontes de sistema; o texto fica com folga. */
const CHAR_WIDTH = 6.9;
const PADDING = 10;

/**
 * Texto do badge (§5.2): "Timeline · AAAA–AAAA · N repos".
 * @example badgeLabel(snapshot) // "Timeline · 2014–2026 · 97 repos"
 */
export function badgeLabel(snapshot: ProfileSnapshot): string {
  const { firstYear, lastYear, repos } = snapshot.stats;
  const span = firstYear === lastYear ? `${firstYear ?? '—'}` : `${firstYear}–${lastYear}`;
  return `Timeline · ${span} · ${repos} ${repos === 1 ? 'repo' : 'repos'}`;
}

/**
 * SVG do badge. Sem snapshot, devolve o badge cinza "não encontrado".
 * @example renderBadge(snapshot, 'claro')
 */
export function renderBadge(snapshot: ProfileSnapshot | null, theme: Theme): string {
  const label = snapshot ? badgeLabel(snapshot) : 'Timeline · não encontrado';
  return badgeSvg(label, PALETTES[snapshot ? theme : 'cinza']);
}

function badgeSvg(label: string, palette: BadgePalette): string {
  const textX = PADDING + SYMBOL_WIDTH + 6;
  const width = Math.ceil(textX + label.length * CHAR_WIDTH + PADDING);
  const text = escapeMarkup(label);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${HEIGHT}" viewBox="0 0 ${width} ${HEIGHT}" role="img" aria-label="${text}">
<title>${text}</title>
<rect x="0.5" y="0.5" width="${width - 1}" height="${HEIGHT - 1}" rx="7" fill="${palette.background}" stroke="${palette.border}"/>
<svg x="${PADDING}" y="7" width="${SYMBOL_WIDTH}" height="14" viewBox="${SYMBOL_VIEWBOX}">${symbolPaths(palette.ink)}</svg>
<text x="${textX}" y="18.5" fill="${palette.text}" font-family="'Mona Sans',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif" font-size="12" font-weight="600">${text}</text>
</svg>`;
}
