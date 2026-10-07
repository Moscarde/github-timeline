import { localeOf } from './locale.js';
import { translate } from '../i18n/translate.js';
import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import type { AppDeps } from './context.js';
import { apiRoutes } from './routes/api.js';
import { badgeRoutes } from './routes/badge.js';
import { cardRoutes } from './routes/card.js';
import { pageRoutes } from './routes/pages.js';
import { systemRoutes } from './routes/system.js';

/**
 * CSP restritiva (§8): só recursos próprios e avatares do GitHub. `style-src-attr` libera
 * apenas atributos `style`, usados nas cores das linguagens.
 */
const CONTENT_SECURITY_POLICY = {
  defaultSrc: ["'self'"],
  imgSrc: [
    "'self'",
    'data:',
    'https://avatars.githubusercontent.com',
    'https://github-timeline.frangolab.com',
  ],
  styleSrc: ["'self'"],
  styleSrcAttr: ["'unsafe-inline'"],
  scriptSrc: ["'self'"],
  connectSrc: ["'self'"],
  fontSrc: ["'self'"],
  objectSrc: ["'none'"],
  baseUri: ["'none'"],
  frameAncestors: ["'none'"],
  formAction: ["'self'"],
};

/**
 * Monta o app Hono com as rotas do §1. Arquivos estáticos ficam a cargo do servidor (`server.ts`).
 * @example const app = createApp({ profiles, progress, cards, quota, logger });
 */
export function createApp(deps: AppDeps): Hono {
  const app = new Hono();
  app.use('*', secureHeaders({ contentSecurityPolicy: CONTENT_SECURITY_POLICY }));
  app.route('/', systemRoutes(deps));
  app.route('/', apiRoutes(deps));
  app.route('/', badgeRoutes(deps));
  app.route('/', cardRoutes(deps));
  app.route('/', pageRoutes(deps));
  app.onError((error, c) => {
    deps.logger.log('error', 'http.unhandled', { path: c.req.path, error: String(error) });
    return c.text(translate('Erro interno.', localeOf(c)), 500);
  });
  return app;
}
