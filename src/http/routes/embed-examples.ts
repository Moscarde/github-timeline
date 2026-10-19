import { Hono, type Context } from 'hono';
import {
  parseAchievementSelection,
  selectAchievements,
} from '../../domain/achievement-selection.js';
import type { ProfileSnapshot } from '../../domain/snapshot.js';
import { renderAchievementStrip } from '../../embed/achievement-strip.js';
import { demoSnapshot } from '../../embed/demo-profile.js';
import { parseEmbedKind, renderEmbed } from '../../embed/embed-renderers.js';
import { translate } from '../../i18n/translate.js';
import { localeOf } from '../locale.js';
import { svgResponse, themeOf } from '../svg-response.js';

/** O perfil de exemplo não muda: as prévias podem ficar um dia em cache. */
const EXAMPLE_MAX_AGE = 86400;

/**
 * `/exemplos/<embed>.svg` e `/exemplos/conquistas/<ids>.svg`: os embeds desenhados com um
 * perfil fictício, para as prévias da landing (inclusive enquanto o visitante escolhe as
 * conquistas). Fica fora de `/embed/` porque "exemplos" poderia ser um username do GitHub.
 * @example app.route('/', embedExampleRoutes())
 */
export function embedExampleRoutes(): Hono {
  const app = new Hono();
  app.get('/exemplos/conquistas/:selection', (c, next) => {
    const selection = parseAchievementSelection(c.req.param('selection'));
    if (!selection.ok) return next();
    const snapshot = exampleSnapshot(c);
    const selected = selectAchievements(snapshot.achievements, selection.ids);
    const svg = renderAchievementStrip({
      snapshot,
      theme: themeOf(c),
      locale: localeOf(c),
      selected,
    });
    return svgResponse(c, svg, 200, EXAMPLE_MAX_AGE);
  });
  app.get('/exemplos/:file', (c, next) => {
    const kind = parseEmbedKind(c.req.param('file'));
    if (!kind) return next();
    const svg = renderEmbed(kind, {
      snapshot: exampleSnapshot(c),
      theme: themeOf(c),
      locale: localeOf(c),
      palette: c.req.query('paleta'),
      style: c.req.query('estilo'),
    });
    return svgResponse(c, svg, 200, EXAMPLE_MAX_AGE);
  });
  return app;
}

/** Perfil de exemplo com o username traduzido para o idioma do pedido. */
function exampleSnapshot(c: Context): ProfileSnapshot {
  return demoSnapshot(translate('seu-usuario', localeOf(c)));
}
