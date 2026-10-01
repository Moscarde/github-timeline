import { Hono, type Context } from 'hono';
import { streamSSE, type SSEStreamingApi } from 'hono/streaming';
import { isValidUsername } from '../../domain/username.js';
import type { ProgressEvent } from '../../services/progress-hub.js';
import { mayCollect } from '../collect-guard.js';
import type { AppDeps } from '../context.js';

/** `/api/profile/<username>` (snapshot em JSON) e `/api/status/<username>` (progresso via SSE). */
export function apiRoutes(deps: AppDeps): Hono {
  const app = new Hono();
  app.get('/api/profile/:username', async (c) => {
    const username = c.req.param('username');
    if (!isValidUsername(username))
      return c.json({ error: `username inválido: recebido "${username}"` }, 400);
    const gate = mayCollect(c, deps, username);
    if (!gate.allowed) return tooManyCollections(c, gate.retryInSeconds);
    const lookup = await deps.profiles.getProfile(username);
    if (lookup.status === 'ok') return c.json({ ...lookup.snapshot, stale: lookup.stale });
    if (lookup.status === 'not_found') return c.json({ error: 'perfil não encontrado' }, 404);
    return c.json({ error: 'GitHub indisponível', reason: lookup.reason }, 503);
  });
  app.get('/api/status/:username', (c) => {
    const username = c.req.param('username');
    if (!isValidUsername(username))
      return c.json({ error: `username inválido: recebido "${username}"` }, 400);
    return streamSSE(c, (stream) => streamProgress(deps, username, stream));
  });
  return app;
}

function tooManyCollections(c: Context, retryInSeconds: number) {
  c.header('Retry-After', String(retryInSeconds));
  return c.json({ error: 'muitas coletas novas deste IP; tente mais tarde', retryInSeconds }, 429);
}

/** Se a coleta já terminou antes da conexão, responde `done` na hora. */
async function streamProgress(
  deps: AppDeps,
  username: string,
  stream: SSEStreamingApi,
): Promise<void> {
  if (!deps.profiles.isCollecting(username)) {
    const finished = deps.profiles.findStored(username) ? 'done' : 'idle';
    await stream.writeSSE({ event: finished, data: '{}' });
    return;
  }
  await new Promise<void>((resolve) => {
    const unsubscribe = deps.progress.subscribe(username, (event) => {
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
    account: account && {
      username: account.username,
      name: account.name,
      avatarUrl: account.avatarUrl,
    },
  };
}
