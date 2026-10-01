import { GithubError } from './errors.js';
import type { QuotaTracker } from './quota.js';

export type FetchFunction = (input: string, init?: RequestInit) => Promise<Response>;

export interface GithubClientOptions {
  token: string;
  fetch: FetchFunction;
  quota: QuotaTracker;
  baseUrl?: string;
}

/** Transporte para a API do GitHub; as regras de coleta ficam em `collector.ts`. */
export interface GithubTransport {
  /** GET REST; devolve `null` em 404. */
  getJson(path: string): Promise<unknown>;
  graphql(query: string, variables: Record<string, unknown>): Promise<unknown>;
}

interface GraphqlEnvelope {
  data?: { rateLimit?: { limit: number; remaining: number; resetAt: string } } & Record<
    string,
    unknown
  >;
  errors?: Array<{ type?: string; message?: string }>;
}

/**
 * Cliente HTTP com o token do servidor. Registra a cota GraphQL a cada resposta.
 * @example const client = new GithubHttpClient({ token, fetch, quota: new QuotaTracker() });
 */
export class GithubHttpClient implements GithubTransport {
  private readonly baseUrl: string;

  constructor(private readonly options: GithubClientOptions) {
    this.baseUrl = options.baseUrl ?? 'https://api.github.com';
  }

  async getJson(path: string): Promise<unknown> {
    const response = await this.send(path, { headers: this.headers() });
    if (response.status === 404) return null;
    await assertOk(response, `GET ${path}`);
    return response.json();
  }

  async graphql(query: string, variables: Record<string, unknown>): Promise<unknown> {
    const body = JSON.stringify({ query, variables });
    const init = { method: 'POST', headers: this.headers(), body };
    const response = await this.send('/graphql', init);
    await assertOk(response, 'POST /graphql');
    const envelope = (await response.json()) as GraphqlEnvelope;
    this.recordQuota(envelope);
    assertNoGraphqlErrors(envelope);
    return envelope.data;
  }

  private async send(path: string, init: RequestInit): Promise<Response> {
    try {
      return await this.options.fetch(this.baseUrl + path, init);
    } catch (cause) {
      throw new GithubError('unavailable', `Falha de rede em ${path}: ${String(cause)}`);
    }
  }

  private headers(): Record<string, string> {
    return {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${this.options.token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'github-timeline',
    };
  }

  private recordQuota(envelope: GraphqlEnvelope): void {
    const rateLimit = envelope.data?.rateLimit;
    if (rateLimit) this.options.quota.record(rateLimit);
  }
}

async function assertOk(response: Response, request: string): Promise<void> {
  if (response.ok) return;
  if (response.status === 401) {
    throw new GithubError('unauthorized', `${request}: token recusado (HTTP 401).`);
  }
  if (isRateLimited(response)) {
    const reset = Number(response.headers.get('x-ratelimit-reset'));
    const resetAt = Number.isFinite(reset) && reset > 0 ? new Date(reset * 1000) : null;
    throw new GithubError('rate_limited', `${request}: cota esgotada.`, resetAt);
  }
  throw new GithubError(
    'unavailable',
    `${request}: esperado HTTP 2xx, recebido ${response.status}.`,
  );
}

function isRateLimited(response: Response): boolean {
  if (response.status === 429) return true;
  return response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0';
}

function assertNoGraphqlErrors(envelope: GraphqlEnvelope): void {
  const first = envelope.errors?.[0];
  if (!first) return;
  if (first.type === 'RATE_LIMITED')
    throw new GithubError('rate_limited', 'GraphQL: cota esgotada.');
  throw new GithubError(
    'invalid_response',
    `GraphQL respondeu erro: ${first.message ?? first.type}.`,
  );
}
