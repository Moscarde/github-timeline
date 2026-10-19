import { DEFAULT_TRAIL_PALETTE, type TrailPaletteId } from './palettes.js';

/**
 * `completo` mostra total e descrição de cada ano; `compacto` deixa só os anos sob a grade,
 * para quem quer a trilha mais limpa no README.
 */
export type TrailStyle = 'completo' | 'compacto';
export const TRAIL_STYLES: readonly TrailStyle[] = ['completo', 'compacto'];
export const DEFAULT_TRAIL_STYLE: TrailStyle = 'completo';

/** Opções de desenho da trilha, vindas de `?paleta=` e `?estilo=`. */
export interface TrailOptions {
  palette: TrailPaletteId;
  style: TrailStyle;
}

export const DEFAULT_TRAIL_OPTIONS: TrailOptions = {
  palette: DEFAULT_TRAIL_PALETTE,
  style: DEFAULT_TRAIL_STYLE,
};

/**
 * Lê `?estilo=`; valor desconhecido ou ausente cai no completo, como `?tema=`.
 * @example parseTrailStyle('compacto') // "compacto"
 */
export function parseTrailStyle(raw: string | undefined | null): TrailStyle {
  return (TRAIL_STYLES as readonly string[]).includes(raw ?? '')
    ? (raw as TrailStyle)
    : DEFAULT_TRAIL_STYLE;
}
