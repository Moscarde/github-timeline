import type { Theme } from '../lib/theme.js';

/** Escala da trilha: vazio (0) ao mais forte (4), mais a cor do cometa e do rótulo de pico. */
export interface TrailScale {
  levels: readonly [string, string, string, string, string];
  accent: string;
  accentInk: string;
}

export type TrailPaletteId = 'roxo' | 'verde' | 'azul' | 'ambar' | 'rosa';
export type RiverPaletteId = 'linguagens' | 'aurora' | 'por-do-sol';

export const DEFAULT_TRAIL_PALETTE: TrailPaletteId = 'roxo';
export const DEFAULT_RIVER_PALETTE: RiverPaletteId = 'linguagens';

const EMPTY = { escuro: '#161b22', claro: '#ebedf0' } as const;

/**
 * Escalas sequenciais de um matiz, claro → escuro no tema claro e o inverso no escuro.
 * Roxo é a marca do projeto; verde reproduz o gráfico de contribuições do GitHub.
 */
const TRAIL_PALETTES: Readonly<Record<TrailPaletteId, Readonly<Record<Theme, TrailScale>>>> = {
  roxo: {
    escuro: scale(EMPTY.escuro, ['#2e2052', '#553a9e', '#8250df', '#c297ff'], '#a371f7', '#d2a8ff'),
    claro: scale(EMPTY.claro, ['#e2d4fb', '#c297ff', '#a371f7', '#6639ba'], '#8250df', '#8250df'),
  },
  verde: {
    escuro: scale(EMPTY.escuro, ['#0e4429', '#006d32', '#26a641', '#39d353'], '#39d353', '#56d364'),
    claro: scale(EMPTY.claro, ['#9be9a8', '#40c463', '#30a14e', '#216e39'], '#1a7f37', '#1a7f37'),
  },
  azul: {
    escuro: scale(EMPTY.escuro, ['#0c2d6b', '#1158c7', '#388bfd', '#79c0ff'], '#58a6ff', '#79c0ff'),
    claro: scale(EMPTY.claro, ['#b6e3ff', '#54aeff', '#0969da', '#0a3069'], '#0969da', '#0969da'),
  },
  ambar: {
    escuro: scale(EMPTY.escuro, ['#4b2900', '#9e6a03', '#d29922', '#f2cc60'], '#e3b341', '#f2cc60'),
    claro: scale(EMPTY.claro, ['#fff1c5', '#f2cc60', '#d4a72c', '#7d4e00'], '#9a6700', '#9a6700'),
  },
  rosa: {
    escuro: scale(EMPTY.escuro, ['#4d1236', '#8e1a5a', '#db61a2', '#ff9bce'], '#f778ba', '#ff9bce'),
    claro: scale(EMPTY.claro, ['#ffd3eb', '#ff80c8', '#bf3989', '#7d2457'], '#bf3989', '#bf3989'),
  },
};

/**
 * Paletas categóricas do rio, aplicadas às faixas na ordem de chegada; a última posição é
 * sempre o cinza de "Outras". Ordem validada pelo validador da skill de dataviz: vizinhas
 * com ΔE ≥ 10 para daltonismo deutan/protan, nos dois temas.
 */
const RIVER_PALETTES: Readonly<Record<Exclude<RiverPaletteId, 'linguagens'>, readonly string[]>> = {
  aurora: ['#2dd4bf', '#a78bfa', '#f59e0b', '#38bdf8', '#f472b6', '#a3e635'],
  'por-do-sol': ['#f97316', '#7c3aed', '#facc15', '#db2777', '#0ea5e9', '#b45309'],
};
export const OTHER_COLOR = '#8b949e';

export const TRAIL_PALETTE_IDS = Object.keys(TRAIL_PALETTES) as TrailPaletteId[];
export const RIVER_PALETTE_IDS: RiverPaletteId[] = ['linguagens', 'aurora', 'por-do-sol'];

function scale(
  empty: string,
  steps: readonly string[],
  accent: string,
  accentInk: string,
): TrailScale {
  const [one = '', two = '', three = '', four = ''] = steps;
  return { levels: [empty, one, two, three, four], accent, accentInk };
}

/**
 * Lê `?paleta=` da trilha; valor desconhecido ou ausente cai no padrão, como `?tema=`.
 * @example parseTrailPalette('verde') // "verde"
 */
export function parseTrailPalette(raw: string | undefined | null): TrailPaletteId {
  return (TRAIL_PALETTE_IDS as string[]).includes(raw ?? '')
    ? (raw as TrailPaletteId)
    : DEFAULT_TRAIL_PALETTE;
}

/**
 * Lê `?paleta=` do rio; valor desconhecido ou ausente cai nas cores das linguagens.
 * @example parseRiverPalette('aurora') // "aurora"
 */
export function parseRiverPalette(raw: string | undefined | null): RiverPaletteId {
  return (RIVER_PALETTE_IDS as string[]).includes(raw ?? '')
    ? (raw as RiverPaletteId)
    : DEFAULT_RIVER_PALETTE;
}

/**
 * Escala da trilha para a paleta e o tema.
 * @example trailScale('verde', 'claro').levels[4] // "#216e39"
 */
export function trailScale(palette: TrailPaletteId, theme: Theme): TrailScale {
  return TRAIL_PALETTES[palette][theme];
}

/**
 * Cores das faixas do rio, uma por posição; `null` na paleta das linguagens (cada faixa usa a
 * cor do Linguist). Mais faixas que cores repetem a sequência, mas o rio tem no máximo 6 + "Outras".
 * @example riverColors('aurora')?.[0] // "#2dd4bf"
 */
export function riverColors(palette: RiverPaletteId): readonly string[] | null {
  return palette === 'linguagens' ? null : RIVER_PALETTES[palette];
}

/** Opção do seletor da landing: id da URL e rótulo-fonte em pt-BR. */
export interface PaletteOption {
  id: string;
  label: string;
}

const TRAIL_LABELS: Readonly<Record<TrailPaletteId, string>> = {
  ...{ roxo: 'Roxo', verde: 'Verde', azul: 'Azul', ambar: 'Âmbar', rosa: 'Rosa' },
};
const RIVER_LABELS: Readonly<Record<RiverPaletteId, string>> = {
  ...{ linguagens: 'Cores das linguagens', aurora: 'Aurora', 'por-do-sol': 'Pôr do sol' },
};
/**
 * Paletas da trilha para o seletor, a padrão primeiro.
 * @example trailPaletteOptions()[1] // { id: 'verde', label: 'Verde' }
 */
export function trailPaletteOptions(): PaletteOption[] {
  return TRAIL_PALETTE_IDS.map((id) => ({ id, label: TRAIL_LABELS[id] }));
}

/**
 * Paletas do rio para o seletor, a padrão (cores das linguagens) primeiro.
 * @example riverPaletteOptions()[0].id // "linguagens"
 */
export function riverPaletteOptions(): PaletteOption[] {
  return RIVER_PALETTE_IDS.map((id) => ({ id, label: RIVER_LABELS[id] }));
}
