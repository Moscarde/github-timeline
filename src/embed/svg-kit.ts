import type { Theme } from '../lib/theme.js';
import { escapeMarkup } from '../lib/escape.js';

/** Cores de um embed. Valores literais: o SVG vira `<img>` e não enxerga o CSS do site. */
export interface EmbedPalette {
  background: string;
  border: string;
  text: string;
  muted: string;
  faint: string;
  /** Escala de intensidade, do vazio (0) ao mais forte (4). */
  levels: readonly [string, string, string, string, string];
  accent: string;
  accentInk: string;
  gold: string;
  blue: string;
  purple: string;
}

/** Mesmos tokens de `public/assets/css/base.css` (§5.3), escala roxa da marca. */
const PALETTES: Readonly<Record<Theme, EmbedPalette>> = {
  escuro: {
    ...{ background: '#0d1117', border: '#30363d', text: '#e6edf3', muted: '#9198a1' },
    ...{ faint: '#7d8590', accent: '#a371f7', accentInk: '#d2a8ff', gold: '#e3b341' },
    ...{ blue: '#4493f8', purple: '#d2a8ff' },
    levels: ['#161b22', '#2e2052', '#553a9e', '#8250df', '#c297ff'],
  },
  claro: {
    ...{ background: '#ffffff', border: '#d1d9e0', text: '#1f2328', muted: '#59636e' },
    ...{ faint: '#6e7781', accent: '#8250df', accentInk: '#8250df', gold: '#9a6700' },
    ...{ blue: '#0969da', purple: '#6639ba' },
    levels: ['#ebedf0', '#e2d4fb', '#c297ff', '#a371f7', '#6639ba'],
  },
};

/**
 * Fontes do sistema: dentro de `<img>` o GitHub não deixa o SVG baixar fontes, então a
 * largura dos textos é estimada com folga (ver `wrapWords`).
 */
export const SANS =
  "-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif";
export const MONO =
  "ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace";

/**
 * Paleta do embed para o tema pedido.
 * @example embedPalette('claro').background // "#ffffff"
 */
export function embedPalette(theme: Theme): EmbedPalette {
  return PALETTES[theme];
}

/** Atributos de um `<text>`; `content` é escapado, `raw` entra como está (tspans próprios). */
export interface TextSpec {
  x: number;
  y: number;
  size: number;
  fill: string;
  content?: string;
  raw?: string;
  font?: 'sans' | 'mono';
  weight?: number;
  anchor?: 'start' | 'middle' | 'end';
  extra?: string;
}

/**
 * Um `<text>` com fonte, cor e alinhamento.
 * @example svgText({ x: 24, y: 38, size: 15, fill: '#fff', content: 'Moscarde' })
 */
export function svgText(spec: TextSpec): string {
  const family = spec.font === 'mono' ? MONO : SANS;
  const weight = spec.weight ? ` font-weight="${spec.weight}"` : '';
  const anchor = spec.anchor && spec.anchor !== 'start' ? ` text-anchor="${spec.anchor}"` : '';
  const body = spec.raw ?? escapeMarkup(spec.content ?? '');
  return `<text x="${round(spec.x)}" y="${round(spec.y)}" font-family="${family}" font-size="${spec.size}"${weight}${anchor} fill="${spec.fill}"${spec.extra ?? ''}>${body}</text>`;
}

/** Documento SVG completo: moldura arredondada, `<title>` acessível e CSS opcional. */
export interface EmbedDocument {
  width: number;
  height: number;
  title: string;
  palette: EmbedPalette;
  body: string;
  style?: string;
}

/**
 * Envolve o corpo no SVG raiz com fundo e borda do tema.
 * @example svgDocument({ width: 840, height: 200, title: 'Trilha', palette, body })
 */
export function svgDocument(doc: EmbedDocument): string {
  const { width, height, palette } = doc;
  const title = escapeMarkup(doc.title);
  const style = doc.style ? `<style>${doc.style}</style>` : '';
  const frame = `<rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="10" fill="${palette.background}" stroke="${palette.border}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}"><title>${title}</title>${style}${frame}${doc.body}</svg>`;
}

/** Título e subtítulo à esquerda, rótulo em mono à direita: cabeçalho comum dos embeds. */
export interface HeaderSpec {
  title: string;
  subtitle: string;
  right: string;
  width: number;
  palette: EmbedPalette;
}

/**
 * Cabeçalho na linha y=38. O separador usa espaço não quebrável: espaços nas bordas de
 * `<tspan>` somem em alguns renderizadores.
 * @example embedHeader({ title: 'Conquistas', subtitle: '5 de 9', right: 'dev', width: 840, palette })
 */
export function embedHeader(spec: HeaderSpec): string {
  const { palette } = spec;
  const subtitle = `<tspan font-weight="400" fill="${palette.muted}">\u00a0·\u00a0${escapeMarkup(spec.subtitle)}</tspan>`;
  const left = svgText({
    ...{ x: 24, y: 38, size: 15, weight: 700, fill: palette.text },
    raw: escapeMarkup(spec.title) + subtitle,
  });
  const right = svgText({
    ...{ x: spec.width - 24, y: 38, size: 12, font: 'mono', anchor: 'end' },
    ...{ fill: palette.muted, content: spec.right },
  });
  return left + right;
}

/**
 * Quebra por palavras em até `maxLines` linhas de `maxChars`; o excesso vira reticências.
 * @example wrapWords('Entram Python, Jupyter e data', 16, 2) // ["Entram Python,", "Jupyter e data"]
 */
export function wrapWords(text: string, maxChars: number, maxLines: number): string[] {
  const lines: string[] = [];
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const current = lines.at(-1);
    if (current !== undefined && `${current} ${word}`.length <= maxChars)
      lines[lines.length - 1] = `${current} ${word}`;
    else lines.push(word);
  }
  if (lines.length <= maxLines) return lines.map((line) => truncate(line, maxChars));
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = truncate(`${kept[maxLines - 1]}…`, maxChars);
  return kept;
}

function truncate(line: string, maxChars: number): string {
  return line.length <= maxChars ? line : `${line.slice(0, maxChars - 1)}…`;
}

/**
 * Arredonda coordenadas para 1 casa: SVG menor e diffs de teste estáveis.
 * @example round(10.04) // 10
 */
export function round(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Desliga as animações para quem pede menos movimento; o quadro final fica visível. */
export const REDUCED_MOTION_CSS =
  '@media (prefers-reduced-motion:reduce){*{animation:none!important}.anim{opacity:1!important;clip-path:none!important}.motion-only{display:none}}';
