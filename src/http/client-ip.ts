import type { Context } from 'hono';

interface NodeBindings {
  incoming?: { socket?: { remoteAddress?: string } };
}

/**
 * IP do visitante para o hash diário de visitas. Atrás do proxy (§7), vale o primeiro
 * endereço de `X-Forwarded-For`; sem nada, "desconhecido" (todas as visitas contam como uma).
 * @example clientIp(c) // "203.0.113.7"
 */
export function clientIp(c: Context): string {
  const forwarded = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwarded) return forwarded;
  const env = c.env as NodeBindings | undefined;
  return env?.incoming?.socket?.remoteAddress ?? 'desconhecido';
}
