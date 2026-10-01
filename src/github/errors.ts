export type GithubErrorKind = 'rate_limited' | 'unavailable' | 'invalid_response' | 'unauthorized';

/** Falha ao falar com a API do GitHub; `kind` decide o estado exibido (§6). */
export class GithubError extends Error {
  constructor(
    readonly kind: GithubErrorKind,
    message: string,
    readonly resetAt: Date | null = null,
  ) {
    super(message);
    this.name = 'GithubError';
  }
}
