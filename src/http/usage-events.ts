import type { MiddlewareHandler } from 'hono';
import type { AppDeps } from './context.js';
import { localeOf } from './locale.js';

const USAGE_ROUTES: ReadonlyArray<readonly [RegExp, string]> = [
  [/^\/$/, 'landing'],
  [/^\/estatisticas$/, 'statistics'],
  [/^\/buscar$/, 'search'],
  [/^\/comparar$/, 'comparison_search'],
  [/^\/u\/[^/]+\/card\.png$/, 'card'],
  [/^\/u\/[^/]+\.\.\.[^/]+$/, 'comparison'],
  [/^\/u\/[^/]+$/, 'timeline'],
  [/^\/badge\/[^/]+$/, 'badge'],
  [/^\/embed\/[^/]+\/.+$/, 'embed'],
  [/^\/api\/profile\/[^/]+$/, 'api_profile'],
  [/^\/api\/status\/[^/]+$/, 'api_status'],
  [/^\/idioma$/, 'language_change'],
];

/** Capture HTTP outcomes without retaining URLs or IPs. @example app.use('*', usageEvents(deps)) */
export function usageEvents(deps: Pick<AppDeps, 'visits' | 'logger'>): MiddlewareHandler {
  return async (c, next): Promise<void> => {
    await next();
    if (c.req.method !== 'GET') return;
    const event = USAGE_ROUTES.find(([pattern]) => pattern.test(c.req.path))?.[1];
    if (!event) return;
    try {
      deps.visits.recordEvent(event, c.res.status, localeOf(c));
    } catch (error: unknown) {
      // A falha de telemetria não deve impedir o acesso ao produto.
      deps.logger.log('error', 'usage.record_failed', { eventName: event, error: String(error) });
    }
  };
}
