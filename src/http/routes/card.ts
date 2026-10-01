import { Hono } from 'hono';
import type { CardVariant } from '../../card/card-layout.js';
import { isValidLogin } from '../../domain/login.js';
import { parseTheme } from '../../lib/theme.js';
import type { AppDeps } from '../context.js';

/** `/u/<login>/card.png` (§5.1): padrão escuro e variante `headline`. */
export function cardRoutes(deps: AppDeps): Hono {
  const app = new Hono();
  app.get('/u/:login/card.png', async (c) => {
    const login = c.req.param('login');
    if (!isValidLogin(login)) return c.text(`login inválido: recebido "${login}"`, 400);
    const lookup = await deps.profiles.getProfile(login);
    if (lookup.status !== 'ok')
      return c.text(
        'card indisponível para este perfil',
        lookup.status === 'not_found' ? 404 : 503,
      );
    const variant: CardVariant = c.req.query('variante') === 'numero' ? 'numero' : 'headline';
    const png = await deps.cards.render(
      lookup.snapshot,
      parseTheme(c.req.query('tema')) ?? 'escuro',
      variant,
    );
    return c.body(png, 200, {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
    });
  });
  return app;
}
