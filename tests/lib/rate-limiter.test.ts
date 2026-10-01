import { describe, expect, it } from 'vitest';
import { FixedWindowRateLimiter } from '../../src/lib/rate-limiter.js';

describe('FixedWindowRateLimiter', () => {
  it('nega acima do limite até a janela virar, separado por chave', () => {
    const clock = { now: new Date('2026-10-01T12:00:00Z') };
    const limiter = new FixedWindowRateLimiter({
      limit: 2,
      windowMs: 60_000,
      now: () => clock.now,
    });
    expect(limiter.tryAcquire('a').allowed).toBe(true);
    expect(limiter.tryAcquire('a').allowed).toBe(true);
    clock.now = new Date('2026-10-01T12:00:20Z');
    expect(limiter.tryAcquire('a')).toEqual({ allowed: false, retryInSeconds: 40 });
    expect(limiter.tryAcquire('b').allowed).toBe(true);
    clock.now = new Date('2026-10-01T12:01:00Z');
    expect(limiter.tryAcquire('a').allowed).toBe(true);
  });
});
