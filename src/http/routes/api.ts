import { Hono } from 'hono';
import { streamSSE, type SSEStreamingApi } from 'hono/streaming';
import { isValidLogin } from '../../domain/login.js';
import type { ProgressEvent } from '../../services/progress-hub.js';
import type { AppDeps } from '../context.js';

/** `/api/profile/<login>` (snapshot em JSON) e `/api/status/<login>` (progresso via SSE). */
export function apiRoutes(deps: AppDeps): Hono {
  const app = new Hono();
  app.get('/api/profile/:login', async (c) => {
    const login = c.req.param('login');
    if (!isValidLogin(login)) return c.json({ error: `login inválido: recebido "${login}"` }, 400);
    const lookup = await deps.profiles.getProfile(login);
    if (lookup.status === 'ok') return c.json({ ...lookup.snapshot, stale: lookup.stale });
    if (lookup.status === 'not_found') return c.json({ error: 'perfil não encontrado' }, 404);
    return c.json({ error: 'GitHub indisponível', reason: lookup.reason }, 503);
  });
  app.get('/api/status/:login', (c) => {
    const login = c.req.param('login');
    if (!isValidLogin(login)) return c.json({ error: `login inválido: recebido "${login}"` }, 400);
    return streamSSE(c, (stream) => streamProgress(deps, login, stream));
  });
  return app;
}

/** Se a coleta já terminou antes da conexão, responde `done` na hora. */
async function streamProgress(
  deps: AppDeps,
  login: string,
  stream: SSEStreamingApi,
): Promise<void> {
  if (!deps.profiles.isCollecting(login)) {
    const finished = deps.profiles.findStored(login) ? 'done' : 'idle';
    await stream.writeSSE({ event: finished, data: '{}' });
    return;
  }
  await new Promise<void>((resolve) => {
    const unsubscribe = deps.progress.subscribe(login, (event) => {
      void stream.writeSSE({ event: event.type, data: JSON.stringify(eventPayload(event)) });
      if (event.type !== 'progress') finish();
    });
    const finish = () => {
      unsubscribe();
      resolve();
    };
    stream.onAbort(finish);
  });
}

function eventPayload(event: ProgressEvent): Record<string, unknown> {
  if (event.type !== 'progress') return {};
  const account = event.account;
  return {
    stage: event.stage,
    account: account && { login: account.login, name: account.name, avatarUrl: account.avatarUrl },
  };
}
