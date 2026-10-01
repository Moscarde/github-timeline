/** Resultado de uma tentativa: `retryInSeconds` só importa quando negada. */
export interface RateDecision {
  allowed: boolean;
  retryInSeconds: number;
}

export interface RateLimiter {
  tryAcquire(key: string): RateDecision;
}

export interface FixedWindowOptions {
  limit: number;
  windowMs: number;
  now: () => Date;
}

/**
 * Janela fixa por chave (ex.: IP): até `limit` permissões a cada `windowMs`. Janelas
 * vencidas são descartadas a cada uso, para o mapa não crescer sem fim.
 * @example new FixedWindowRateLimiter({ limit: 10, windowMs: 600_000, now }).tryAcquire(ip)
 */
export class FixedWindowRateLimiter implements RateLimiter {
  private readonly windows = new Map<string, { count: number; resetAt: number }>();

  constructor(private readonly options: FixedWindowOptions) {}

  tryAcquire(key: string): RateDecision {
    const now = this.options.now().getTime();
    this.prune(now);
    const window = this.windows.get(key) ?? { count: 0, resetAt: now + this.options.windowMs };
    const retryInSeconds = Math.ceil((window.resetAt - now) / 1000);
    if (window.count >= this.options.limit) return { allowed: false, retryInSeconds };
    this.windows.set(key, { ...window, count: window.count + 1 });
    return { allowed: true, retryInSeconds: 0 };
  }

  private prune(now: number): void {
    for (const [key, window] of this.windows) if (window.resetAt <= now) this.windows.delete(key);
  }
}
