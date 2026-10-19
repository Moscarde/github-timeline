import type { Context } from 'hono';
import { Hono } from 'hono';
import { ACHIEVEMENT_IDS } from '../../domain/achievements.js';
import {
  parseAchievementSelection,
  selectAchievements,
} from '../../domain/achievement-selection.js';
import { isValidUsername } from '../../domain/username.js';
import { renderAchievementStrip } from '../../embed/achievement-strip.js';
import {
  NOTICE_HEADING,
  parseEmbedKind,
  renderEmbed,
  type EmbedRenderer,
} from '../../embed/embed-renderers.js';
import { renderEmbedNotice } from '../../embed/notice.js';
import type { Locale } from '../../i18n/locale.js';
import { localizeSnapshot } from '../../i18n/snapshot.js';
import { message, translate } from '../../i18n/translate.js';
import type { Theme } from '../../lib/theme.js';
import { collectInBackground } from '../background-collect.js';
import type { AppDeps } from '../context.js';
import { usernameError } from '../input-errors.js';
import { localeOf } from '../locale.js';
import { svgResponse, themeOf } from '../svg-response.js';

/** Aviso de coleta expira rápido para o README mostrar o embed assim que o perfil existir. */
const NOTICE_MAX_AGE = 60;
const EMBED_MAX_AGE = 3600;

/**
 * Embeds para profile README (§5.4), sempre SVG servido do snapshot salvo:
 * `/embed/<user>/trilha.svg`, `/embed/<user>/linguagens.svg`, `/embed/<user>/conquistas.svg`
 * e `/embed/<user>/conquistas/<id>,<id>.svg` com as conquistas escolhidas.
 * @example app.route('/', embedRoutes(deps))
 */
export function embedRoutes(deps: AppDeps): Hono {
  const app = new Hono();
  app.get('/embed/:username/conquistas/:selection', (c) => serveSelection(c, deps));
  app.get('/embed/:username/:file', (c, next) => {
    const kind = parseEmbedKind(c.req.param('file'));
    if (!kind) return next();
    return serveEmbed(c, deps, (request) => renderEmbed(kind, request));
  });
  return app;
}

function serveSelection(c: Context, deps: AppDeps): Response {
  const selection = parseAchievementSelection(c.req.param('selection') ?? '');
  if (!selection.ok) {
    const notice = selectionError(selection.received, themeOf(c), localeOf(c));
    return svgResponse(c, notice, 400, NOTICE_MAX_AGE);
  }
  return serveEmbed(c, deps, (request) =>
    renderAchievementStrip({
      ...request,
      selected: selectAchievements(request.snapshot.achievements, selection.ids),
    }),
  );
}

/** Fluxo comum: valida o username, lê o snapshot salvo e, se faltar, dispara a coleta. */
function serveEmbed(c: Context, deps: AppDeps, render: EmbedRenderer): Response {
  const username = c.req.param('username') ?? '';
  const [theme, locale] = [themeOf(c), localeOf(c)];
  if (!isValidUsername(username)) {
    const text = usernameError(username, locale);
    return svgResponse(
      c,
      renderEmbedNotice({ theme, heading: NOTICE_HEADING, text }),
      400,
      NOTICE_MAX_AGE,
    );
  }
  const stored = deps.profiles.findStored(username);
  if (!stored) return svgResponse(c, pendingNotice(c, deps, username, theme), 200, NOTICE_MAX_AGE);
  const snapshot = localizeSnapshot(stored, locale);
  const [palette, style] = [c.req.query('paleta'), c.req.query('estilo')];
  return svgResponse(c, render({ snapshot, theme, locale, palette, style }), 200, EMBED_MAX_AGE);
}

/** Sem snapshot: responde 200 com aviso, porque o proxy de imagens do GitHub esconde erros. */
function pendingNotice(c: Context, deps: AppDeps, username: string, theme: Theme): string {
  const locale = localeOf(c);
  const started = collectInBackground(c, deps, username, 'embed.collection_failed');
  const text = started
    ? message('Gerando a timeline de @{0}. Recarregue em alguns minutos.', locale, [username])
    : message('Muitas timelines novas a partir deste endereço. Tente @{0} mais tarde.', locale, [
        username,
      ]);
  return renderEmbedNotice({ theme, heading: NOTICE_HEADING, text });
}

function selectionError(received: string, theme: Theme, locale: Locale): string {
  const source =
    'conquistas inválidas: recebido "{0}"; esperado ids separados por vírgula entre {1}.';
  const text = message(source, locale, [received, ACHIEVEMENT_IDS.join(', ')]);
  return renderEmbedNotice({ theme, heading: translate('Conquistas', locale), text });
}
