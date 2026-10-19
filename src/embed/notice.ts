import type { Theme } from '../lib/theme.js';
import { embedPalette, svgDocument, svgText, wrapWords } from './svg-kit.js';

const WIDTH = 480;
const LINE_CHARS = 66;
const LINE_HEIGHT = 17;

/** Aviso no lugar do embed: perfil em coleta, sem dados ou URL inválida. */
export interface EmbedNotice {
  theme: Theme;
  heading: string;
  text: string;
}

/**
 * Cartão pequeno com um aviso. Sai como SVG porque o README só mostra imagens: um texto
 * puro apareceria como imagem quebrada.
 * @example renderEmbedNotice({ theme: 'escuro', heading: 'github timeline', text: 'Gerando…' })
 */
export function renderEmbedNotice(notice: EmbedNotice): string {
  const palette = embedPalette(notice.theme);
  const lines = wrapWords(notice.text, LINE_CHARS, 5);
  const height = 62 + lines.length * LINE_HEIGHT;
  const heading = svgText({
    ...{ x: 24, y: 36, size: 13, font: 'mono', weight: 700 },
    ...{ fill: palette.accentInk, content: notice.heading },
  });
  const body = lines
    .map((line, index) =>
      svgText({ x: 24, y: 62 + index * LINE_HEIGHT, size: 12, fill: palette.muted, content: line }),
    )
    .join('');
  return svgDocument({
    width: WIDTH,
    height,
    title: `${notice.heading}: ${notice.text}`,
    palette,
    body: heading + body,
  });
}
