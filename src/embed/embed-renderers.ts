import type { ProfileSnapshot } from '../domain/snapshot.js';
import type { Locale } from '../i18n/locale.js';
import { message } from '../i18n/translate.js';
import type { Theme } from '../lib/theme.js';
import { renderAchievementStrip } from './achievement-strip.js';
import { renderEmbedNotice } from './notice.js';
import { parseRiverPalette, parseTrailPalette } from './palettes.js';
import { renderRiver } from './river.js';
import { renderTrail } from './trail.js';
import { parseTrailStyle } from './trail-options.js';

/** Snapshot já localizado, tema e idioma do pedido: tudo que um embed precisa para desenhar. */
export interface EmbedRequest {
  snapshot: ProfileSnapshot;
  theme: Theme;
  locale: Locale;
  /** `?paleta=` cru; cada embed lê o que entende e ignora o resto. */
  palette?: string | null;
  /** `?estilo=` cru; só a trilha usa. */
  style?: string | null;
}

export type EmbedRenderer = (request: EmbedRequest) => string;

/** Nome do arquivo na URL (`/embed/<user>/<nome>.svg`) de cada embed. */
export type EmbedKind = 'trilha' | 'linguagens' | 'conquistas';
export const EMBED_KINDS: readonly EmbedKind[] = ['trilha', 'linguagens', 'conquistas'];
export const NOTICE_HEADING = 'github timeline';

const RENDERERS: Readonly<Record<EmbedKind, EmbedRenderer>> = {
  trilha: timelineOnly(({ snapshot, theme, locale, palette, style }) =>
    renderTrail(snapshot, theme, locale, {
      palette: parseTrailPalette(palette),
      style: parseTrailStyle(style),
    }),
  ),
  linguagens: timelineOnly(({ snapshot, theme, locale, palette }) =>
    renderRiver(snapshot, theme, locale, parseRiverPalette(palette)),
  ),
  conquistas: renderAchievementStrip,
};

/**
 * Desenha o embed pedido; usado pelas rotas de perfil e pelas prévias da landing.
 * @example renderEmbed('trilha', { snapshot, theme: 'escuro', locale: 'pt-BR' })
 */
export function renderEmbed(kind: EmbedKind, request: EmbedRequest): string {
  return RENDERERS[kind](request);
}

/**
 * Converte o nome do arquivo da URL em embed conhecido.
 * @example parseEmbedKind('trilha.svg') // "trilha"
 */
export function parseEmbedKind(file: string): EmbedKind | null {
  const name = file.replace(/\.svg$/i, '');
  return (EMBED_KINDS as readonly string[]).includes(name) ? (name as EmbedKind) : null;
}

/** Trilha e rio dependem das eras: sem timeline (organizações), mostram um aviso. */
function timelineOnly(render: EmbedRenderer): EmbedRenderer {
  return (request) =>
    request.snapshot.timeline.length ? render(request) : noTimelineNotice(request);
}

function noTimelineNotice({ snapshot, theme, locale }: EmbedRequest): string {
  const text = message(
    '@{0} não tem linha do tempo: organizações e perfis sem repositórios públicos ficam de fora.',
    locale,
    [snapshot.account.username],
  );
  return renderEmbedNotice({ theme, heading: NOTICE_HEADING, text });
}
