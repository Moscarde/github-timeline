import { usageEvents } from './usage-events.js';
import { localeOf } from './locale.js';
import { translate } from '../i18n/translate.js';
import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import type { AppDeps } from './context.js';
import { apiRoutes } from './routes/api.js';
import { badgeRoutes } from './routes/badge.js';
import { cardRoutes } from './routes/card.js';
import { embedRoutes } from './routes/embed.js';
import { embedExampleRoutes } from './routes/embed-examples.js';
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
 * SVGs embedáveis (badge, embeds e prévias): a CSP das páginas bloquearia o `<style>` que
 * anima trilha e rio, e `Cross-Origin-Resource-Policy: same-origin` quebraria a imagem em
 * qualquer site que não seja o GitHub (que reenvia pelo camo). Nada além de estilo inline
 * e imagens `data:` é liberado.
 */
const SVG_CONTENT_SECURITY_POLICY = {
  defaultSrc: ["'none'"],
  styleSrc: ["'unsafe-inline'"],
  imgSrc: ['data:'],
};
const EMBEDDABLE_PATHS = /^\/(?:badge|embed|exemplos)\//;
const PAGE_HEADERS = secureHeaders({ contentSecurityPolicy: CONTENT_SECURITY_POLICY });
const EMBEDDABLE_HEADERS = secureHeaders({
  contentSecurityPolicy: SVG_CONTENT_SECURITY_POLICY,
  crossOriginResourcePolicy: 'cross-origin',
});

/**
 * Monta o app Hono com as rotas do §1. Arquivos estáticos ficam a cargo do servidor (`server.ts`).
 * @example const app = createApp({ profiles, progress, cards, quota, logger });
 */
export function createApp(deps: AppDeps): Hono {
  const app = new Hono();
  app.use('*', (c, next) =>
    (EMBEDDABLE_PATHS.test(c.req.path) ? EMBEDDABLE_HEADERS : PAGE_HEADERS)(c, next),
  );
  app.use('*', usageEvents(deps));
  app.route('/', systemRoutes(deps));
  app.route('/', apiRoutes(deps));
  app.route('/', badgeRoutes(deps));
  app.route('/', cardRoutes(deps));
  app.route('/', embedRoutes(deps));
  app.route('/', embedExampleRoutes());
  app.route('/', pageRoutes(deps));
  app.onError((error, c) => {
    deps.logger.log('error', 'http.unhandled', { path: c.req.path, error: String(error) });
    return c.text(translate('Erro interno.', localeOf(c)), 500);
  });
  return app;
}
