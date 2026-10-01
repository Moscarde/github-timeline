import { Hono } from 'hono';
import type { AppDeps } from '../context.js';

/** `/healthz`: saúde e cota restante, para monitoramento (§8). */
export function systemRoutes(deps: AppDeps): Hono {
  const app = new Hono();
  app.get('/healthz', (c) => c.json({ status: 'ok', quota: deps.quota.current() }));
  return app;
}
