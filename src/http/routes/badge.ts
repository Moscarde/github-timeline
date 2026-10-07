import { localeOf } from '../locale.js';
import { Hono } from 'hono';
import { renderBadge } from '../../brand/badge.js';
import { isValidUsername } from '../../domain/username.js';
import { mayCollect } from '../collect-guard.js';
import type { AppDeps } from '../context.js';

/**
 * `/badge/<username>.svg` (§5.2): sempre 200, servido do snapshot. Sem snapshot, dispara a
 * coleta (sujeita ao limite por IP) e responde o cinza; o proxy de imagens do GitHub não exibe
 * respostas de erro.
 */
export function badgeRoutes(deps: AppDeps): Hono {
  const app = new Hono();
  app.get('/badge/:file', (c) => {
    const username = c.req.param('file').replace(/\.svg$/i, '');
    const snapshot = isValidUsername(username) ? deps.profiles.findStored(username) : null;
    if (!snapshot && isValidUsername(username) && mayCollect(c, deps, username).allowed)
      void deps.profiles.getProfile(username);
    const svg = renderBadge(snapshot, localeOf(c));
    return c.body(svg, 200, {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'max-age=3600',
      'Content-Language': localeOf(c),
      Vary: 'Accept-Language, Cookie',
    });
  });
  return app;
}
