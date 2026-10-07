import { usernameError } from '../input-errors.js';
import { translate } from '../../i18n/translate.js';
import { localeOf } from '../locale.js';
import { Hono } from 'hono';
import type { CardVariant } from '../../card/card-layout.js';
import { isValidUsername } from '../../domain/username.js';
import { parseTheme } from '../../lib/theme.js';
import { mayCollect } from '../collect-guard.js';
import type { AppDeps } from '../context.js';

/** `/u/<username>/card.png` (§5.1): padrão escuro e variante `headline`. */
export function cardRoutes(deps: AppDeps): Hono {
  const app = new Hono();
  app.get('/u/:username/card.png', async (c) => {
    const username = c.req.param('username');
    if (!isValidUsername(username)) return c.text(usernameError(username, localeOf(c)), 400);
    const gate = mayCollect(c, deps, username);
    if (!gate.allowed) {
      c.header('Retry-After', String(gate.retryInSeconds));
      return c.text(translate('muitas coletas novas deste IP; tente mais tarde', localeOf(c)), 429);
    }
    const lookup = await deps.profiles.getProfile(username);
    if (lookup.status !== 'ok')
      return c.text(
        translate('card indisponível para este perfil', localeOf(c)),
        lookup.status === 'not_found' ? 404 : 503,
      );
    const variant: CardVariant = c.req.query('variante') === 'numero' ? 'numero' : 'headline';
    const png = await deps.cards.render(
      lookup.snapshot,
      parseTheme(c.req.query('tema')) ?? 'escuro',
      variant,
      localeOf(c),
    );
    return c.body(png, 200, {
      'Content-Type': 'image/png',
      'Cache-Control': c.req.query('lang') ? 'public, max-age=3600' : 'private, max-age=3600',
      'Content-Language': localeOf(c),
      Vary: 'Accept-Language, Cookie',
    });
  });
  return app;
}
