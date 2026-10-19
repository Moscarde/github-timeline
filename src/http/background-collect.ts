import type { Context } from 'hono';
import { isValidUsername } from '../domain/username.js';
import { mayCollect } from './collect-guard.js';
import type { AppDeps } from './context.js';

/**
 * Dispara a coleta sem esperar por ela, respeitando o limite por IP. Usado por imagens
 * (badge e embeds), que respondem na hora e mostram o resultado na próxima carga.
 * Devolve se a coleta foi disparada.
 * @example collectInBackground(c, deps, 'dev', 'embed.collection_failed')
 */
export function collectInBackground(
  c: Context,
  deps: AppDeps,
  username: string,
  failureEvent: string,
): boolean {
  if (!isValidUsername(username) || !mayCollect(c, deps, username).allowed) return false;
  // Sem o `catch`, um erro que não é do GitHub vira unhandled rejection e derruba o processo.
  deps.profiles.getProfile(username).catch((error: unknown) => {
    deps.logger.log('error', failureEvent, { username, error: String(error) });
  });
  return true;
}
