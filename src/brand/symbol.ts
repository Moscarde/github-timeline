/** Cores da direção 1 — Path of activity (brand-tokens.json do design kit). */
export const BRAND = {
  green: '#22C55E',
  greenSoft: '#DCFCE7',
  greenText: '#1a7f37',
  navy: '#0F172A',
  slate: '#475569',
  slate2: '#64748B',
  light: '#F8FAFC',
  line: '#E2E8F0',
  white: '#FFFFFF',
} as const;

/** Recorte do viewBox 256×256 original que contém o traçado, sem alterar proporções. */
export const SYMBOL_VIEWBOX = '20 64 212 68';

/**
 * Traçado do símbolo copiado de `direction-1-path-of-activity/svg/symbol.svg`.
 * `ink` é a cor da linha e dos marcos; o marco de descoberta fica sempre verde.
 * @example `<svg viewBox="${SYMBOL_VIEWBOX}">${symbolPaths(BRAND.navy)}</svg>`
 */
export function symbolPaths(ink: string): string {
  const green = BRAND.green;
  return [
    `<path d="M 28.0 108.0 L 43.0 93.0 M 28.0 108.0 L 43.0 123.0" stroke="${ink}" stroke-width="7.0" stroke-linecap="round"/>`,
    `<path d="M 208.0 93.0 L 223.0 108.0 M 208.0 123.0 L 223.0 108.0" stroke="${ink}" stroke-width="7.0" stroke-linecap="round"/>`,
    `<line x1="53.0" y1="108.0" x2="198.0" y2="108.0" stroke="${ink}" stroke-width="6.0" stroke-linecap="round"/>`,
    `<circle cx="73.0" cy="108.0" r="10.0" fill="${ink}"/>`,
    `<circle cx="108.0" cy="108.0" r="10.0" fill="${ink}"/>`,
    `<circle cx="143.0" cy="108.0" r="10.0" fill="${green}"/>`,
    `<circle cx="178.0" cy="108.0" r="10.0" fill="${ink}"/>`,
    `<circle cx="143.0" cy="108.0" r="16.0" fill="none" stroke="${green}" stroke-width="5.0"/>`,
    `<line x1="143.0" y1="83.0" x2="143.0" y2="73.0" stroke="${green}" stroke-width="5.0" stroke-linecap="round"/>`,
    `<line x1="159.07" y1="88.85" x2="165.5" y2="81.19" stroke="${green}" stroke-width="5.0" stroke-linecap="round"/>`,
    `<line x1="167.62" y1="103.66" x2="177.47" y2="101.92" stroke="${green}" stroke-width="5.0" stroke-linecap="round"/>`,
  ].join('');
}
