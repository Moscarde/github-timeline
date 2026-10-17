import type { Context } from 'hono';

interface NodeBindings {
  incoming?: { socket?: { remoteAddress?: string } };
}

/**
 * IP do visitante para o hash diário de visitas. Atrás do proxy (§7), vale o primeiro
 * endereço de `X-Forwarded-For`; sem nada, "desconhecido" (visitantes distintos ficam agrupados no ranking).
 * O primeiro endereço vem do cliente e pode ser forjado: aceito de propósito, porque aqui só
 * afeta o ranking de visitas. Para proteger a cota do GitHub, use `proxiedClientIp`.
 * @example clientIp(c) // "203.0.113.7"
 */
export function clientIp(c: Context): string {
  const forwarded = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwarded) return forwarded;
  return socketAddress(c);
}

/**
 * IP que o Nginx viu na conexão: o último endereço de `X-Forwarded-For`, acrescentado pelo
 * próprio proxy (`$proxy_add_x_forwarded_for`). Os anteriores vêm do cliente e são ignorados,
 * senão um header forjado burla o limite de coletas por IP.
 * @example proxiedClientIp(c) // "203.0.113.7" para "1.2.3.4, 203.0.113.7"
 */
export function proxiedClientIp(c: Context): string {
  const forwarded = c.req.header('x-forwarded-for')?.split(',').at(-1)?.trim();
  if (forwarded) return forwarded;
  return socketAddress(c);
}

function socketAddress(c: Context): string {
  const env = c.env as NodeBindings | undefined;
  return env?.incoming?.socket?.remoteAddress ?? 'desconhecido';
}
