import { CANONICAL_ORIGIN } from '../../config.js';
import type { EmbedKind } from '../../embed/embed-renderers.js';
import { riverPaletteOptions, trailPaletteOptions } from '../../embed/palettes.js';
import type { Locale } from '../../i18n/locale.js';

/** Formatos da seção "Leve sua timeline para o README". */
export type ReadmeItemId = 'badge' | EmbedKind;

/** Uma opção da URL, mostrada como código e explicação. */
export interface ReadmeOption {
  code: string;
  text: string;
}

/** Conteúdo de um formato: textos-fonte em pt-BR, traduzidos na view. */
export interface ReadmeItem {
  id: ReadmeItemId;
  label: string;
  description: string;
  /** Texto alternativo do snippet e da prévia. */
  alt: string;
  options: ReadmeOption[];
  /** Ajustes da URL oferecidos como select; ausente nos formatos sem ajuste. */
  settings?: ReadmeSetting[];
}

/**
 * Opções que valem para todos os formatos; a seção mostra uma vez só, no topo.
 * O badge tem cores fixas e ignora `tema` (§5.2).
 */
export const SHARED_OPTIONS: readonly ReadmeOption[] = [
  { code: 'tema=escuro|claro', text: 'cores da imagem; o padrão é escuro' },
  { code: 'lang=pt-BR|en', text: 'idioma dos textos' },
];

/** Um ajuste da URL (`?paleta=`, `?estilo=`) oferecido como select; a primeira opção é a padrão. */
export interface ReadmeSetting {
  param: 'paleta' | 'estilo';
  label: string;
  options: SettingOption[];
}

/** Opção de um ajuste: valor da URL e rótulo-fonte em pt-BR. */
export interface SettingOption {
  id: string;
  label: string;
}

const PALETTE_SETTING = (options: SettingOption[]): ReadmeSetting => ({
  ...{ param: 'paleta', label: 'Paleta de cores', options },
});

/** Estilo compacto: só os anos sob a grade, sem total nem descrição. */
const TRAIL_STYLE_SETTING: ReadmeSetting = {
  ...{ param: 'estilo', label: 'Descrição dos anos' },
  options: [
    { id: 'completo', label: 'Mostrar' },
    { id: 'compacto', label: 'Ocultar (versão compacta)' },
  ],
};

/** Ordem da seção: os embeds primeiro, o badge (o mais discreto) por último. */
export const README_ITEMS: readonly ReadmeItem[] = [
  {
    ...{ id: 'trilha', label: 'Trilha da carreira', alt: 'Trilha da carreira' },
    description:
      'A carreira inteira, mês a mês: um cometa percorre os anos e acende as contribuições, com o nome de cada fase.',
    options: [],
    settings: [PALETTE_SETTING(trailPaletteOptions()), TRAIL_STYLE_SETTING],
  },
  {
    ...{ id: 'linguagens', label: 'Rio de linguagens', alt: 'Rio de linguagens' },
    description:
      'Como a sua stack mudou: cada faixa é uma linguagem, e a largura é quantos repositórios você criou nela em cada ano.',
    options: [],
    settings: [PALETTE_SETTING(riverPaletteOptions())],
  },
  {
    ...{ id: 'conquistas', label: 'Conquistas', alt: 'Conquistas' },
    description: 'As conquistas da sua timeline, com as que faltam e o progresso.',
    options: [],
  },
  {
    ...{ id: 'badge', label: 'Badge', alt: 'GitHub Timeline' },
    description:
      'Um selo pequeno com os anos e o total de repositórios, que leva direto para a sua timeline.',
    options: [],
  },
];

/**
 * Endereço da página da timeline, com idioma.
 * @example timelineUrl('seu-usuario', 'en') // "https://…/u/seu-usuario?lang=en"
 */
export function timelineUrl(username: string, locale: Locale): string {
  return `${CANONICAL_ORIGIN}/u/${username}?lang=${locale}`;
}

/**
 * Markdown do badge, igual ao do perfil.
 * @example badgeSnippet('seu-usuario', 'pt-BR')
 */
export function badgeSnippet(username: string, locale: Locale): string {
  const badge = `${CANONICAL_ORIGIN}/badge/${username}.svg?lang=${locale}`;
  return `[![GitHub Timeline](${badge})](${timelineUrl(username, locale)})`;
}

/**
 * Markdown de um embed para o README: a imagem com link para a timeline, numa linha só.
 * @example embedSnippet({ kind: 'trilha', username: 'dev', locale: 'pt-BR', alt: 'Trilha' })
 */
export function embedSnippet(input: {
  kind: EmbedKind;
  username: string;
  locale: Locale;
  alt: string;
}): string {
  const image = `${CANONICAL_ORIGIN}/embed/${input.username}/${input.kind}.svg?lang=${input.locale}`;
  return `[![${input.alt}](${image})](${timelineUrl(input.username, input.locale)})`;
}
