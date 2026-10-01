import { describe, expect, it } from 'vitest';
import { GithubHttpClient } from '../../src/github/client.js';
import { GithubError } from '../../src/github/errors.js';
import { QuotaTracker } from '../../src/github/quota.js';
import { FakeFetch, jsonResponse } from '../fakes/fake-fetch.js';

function setup() {
  const fake = new FakeFetch();
  const quota = new QuotaTracker();
  const client = new GithubHttpClient({ token: 'tkn', fetch: fake.fetch, quota });
  return { fake, quota, client };
}

describe('GithubHttpClient', () => {
  it('envia o token e devolve null em 404', async () => {
    const { fake, client } = setup();
    fake.enqueue(jsonResponse({ message: 'Not Found' }, 404));
    expect(await client.getJson('/users/ghost')).toBeNull();
    expect(fake.requests[0]?.url).toBe('https://api.github.com/users/ghost');
    expect((fake.requests[0]?.init?.headers as Record<string, string>).Authorization).toBe(
      'Bearer tkn',
    );
  });

  it('registra a cota do GraphQL', async () => {
    const { fake, quota, client } = setup();
    fake.enqueue(
      jsonResponse({
        data: { rateLimit: { limit: 5000, remaining: 400, resetAt: '2026-09-30T01:00:00Z' } },
      }),
    );
    await client.graphql('query { rateLimit { limit } }', {});
    expect(quota.current()?.remaining).toBe(400);
    expect(quota.isLow()).toBe(true);
  });

  it('identifica cota esgotada no REST', async () => {
    const { fake, client } = setup();
    fake.enqueue(
      jsonResponse({}, 403, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1790000000' }),
    );
    const error = await client.getJson('/users/x').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(GithubError);
    expect(error).toMatchObject({ kind: 'rate_limited' });
    expect((error as GithubError).resetAt?.getTime()).toBe(1790000000 * 1000);
  });

  it('converte erros GraphQL e de rede', async () => {
    const { fake, client } = setup();
    fake.enqueue(jsonResponse({ errors: [{ type: 'RATE_LIMITED', message: 'x' }] }));
    await expect(client.graphql('q', {})).rejects.toMatchObject({ kind: 'rate_limited' });
    fake.enqueue(jsonResponse({ errors: [{ message: 'boom' }] }));
    await expect(client.graphql('q', {})).rejects.toMatchObject({ kind: 'invalid_response' });
    fake.enqueue(new TypeError('offline'));
    await expect(client.getJson('/users/x')).rejects.toMatchObject({ kind: 'unavailable' });
  });

  it('informa o status recebido em erro HTTP', async () => {
    const { fake, client } = setup();
    fake.enqueue(jsonResponse({}, 502));
    await expect(client.getJson('/users/x')).rejects.toThrow('recebido 502');
  });
});

describe('QuotaTracker', () => {
  it('não é baixa sem leitura', () => {
    expect(new QuotaTracker().isLow()).toBe(false);
  });
});
