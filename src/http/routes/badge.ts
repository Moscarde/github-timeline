import { Hono } from 'hono';
import { renderBadge } from '../../brand/badge.js';
import { isValidLogin } from '../../domain/login.js';
import { parseTheme } from '../../lib/theme.js';
import type { AppDeps } from '../context.js';

/**
 * `/badge/<login>.svg` (§5.2): sempre 200, servido do snapshot. Sem snapshot, dispara a
 * coleta e responde o cinza; o proxy de imagens do GitHub não exibe respostas de erro.
 */
export function badgeRoutes(deps: AppDeps): Hono {
  const app = new Hono();
  app.get('/badge/:file', (c) => {
    const login = c.req.param('file').replace(/\.svg$/i, '');
    const snapshot = isValidLogin(login) ? deps.profiles.findStored(login) : null;
    if (!snapshot && isValidLogin(login)) void deps.profiles.getProfile(login);
    const svg = renderBadge(snapshot, parseTheme(c.req.query('tema')) ?? 'claro');
    return c.body(svg, 200, {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'max-age=3600',
    });
  });
  return app;
}
