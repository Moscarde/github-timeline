import type { FetchFunction } from '../../src/github/client.js';

export interface RecordedRequest {
  url: string;
  init: RequestInit | undefined;
}

/** `fetch` falso que devolve respostas em fila e registra as requisições. */
export class FakeFetch {
  readonly requests: RecordedRequest[] = [];
  private readonly queue: Array<Response | Error> = [];

  enqueue(response: Response | Error): this {
    this.queue.push(response);
    return this;
  }

  readonly fetch: FetchFunction = async (url, init) => {
    this.requests.push({ url, init });
    const next = this.queue.shift();
    if (!next) throw new Error(`FakeFetch: nenhuma resposta enfileirada para ${url}`);
    if (next instanceof Error) throw next;
    return next;
  };
}

export function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}
