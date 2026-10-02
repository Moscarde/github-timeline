import { node, type CardNode } from './element.js';

/** Caractere de star usado nas manchetes (`headline.ts`). */
export const STAR_CHAR = '★';

/** Estrela de 5 pontas num viewBox 24×24, mesma silhueta do ★ do GitHub. */
const STAR_PATH =
  'M12 1.5l3.09 6.26 6.91 1-5 4.87 1.18 6.87L12 17.25l-6.18 3.25L7 13.63 2 8.76l6.91-1L12 1.5z';

/**
 * Desenha a ★ como SVG: as fontes do card (subset latin) não têm U+2605 e o Satori
 * mostraria um glifo quebrado no PNG exportado.
 * @example starGlyph('#e3b341', 76, 19)
 */
export function starGlyph(color: string, size: number, gapRight: number): CardNode {
  const side = Math.round(size * 0.8);
  return node(
    'svg',
    { width: side, height: side, marginRight: gapRight, alignSelf: 'center' },
    node('path', {}, null, { d: STAR_PATH, fill: color }),
    { width: side, height: side, viewBox: '0 0 24 24' },
  );
}
