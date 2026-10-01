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
    if (!isValidUsername(username)) return c.text(`username inválido: recebido "${username}"`, 400);
    const gate = mayCollect(c, deps, username);
    if (!gate.allowed) {
      c.header('Retry-After', String(gate.retryInSeconds));
      return c.text('muitas coletas novas deste IP; tente mais tarde', 429);
    }
    const lookup = await deps.profiles.getProfile(username);
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
