import type { Context } from 'hono';
import type { RateDecision } from '../lib/rate-limiter.js';
import { clientIp } from './client-ip.js';
import type { AppDeps } from './context.js';

const ALLOWED: RateDecision = { allowed: true, retryInSeconds: 0 };

/**
 * Rate limit por IP só para pedidos que disparam coleta nova (§8, "Abuso"): perfis já
 * salvos ou já em coleta não gastam a cota de ninguém e passam sempre.
 * @example if (!mayCollect(c, deps, username).allowed) return c.json({ … }, 429);
 */
export function mayCollect(c: Context, deps: AppDeps, username: string): RateDecision {
  if (deps.profiles.findStored(username) || deps.profiles.isCollecting(username)) return ALLOWED;
  return deps.collectLimiter.tryAcquire(clientIp(c));
}
