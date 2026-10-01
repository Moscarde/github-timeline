import { usernameKey } from '../domain/username.js';
import type { GithubTransport } from './client.js';

/** Username parecido, para o "Você quis dizer" do 404 (§6). */
export interface UsernameSuggestion {
  username: string;
  avatarUrl: string;
}

export interface UsernameSuggester {
  suggest(username: string): Promise<UsernameSuggestion | null>;
}

interface SearchUsers {
  items?: Array<{ login: string; avatar_url: string }>;
}

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Sugestão via `GET /search/users`, cacheada por username digitado. Falha da API vira `null`:
 * a sugestão é um extra e não pode derrubar a página de 404.
 * @example await suggester.suggest('torvaldz') // { username: 'torvalds', … }
 */
export class GithubUsernameSuggester implements UsernameSuggester {
  private readonly cache = new Map<string, { value: UsernameSuggestion | null; expires: number }>();

  constructor(
    private readonly transport: GithubTransport,
    private readonly now: () => Date,
    private readonly ttlMs = DEFAULT_TTL_MS,
  ) {}

  async suggest(username: string): Promise<UsernameSuggestion | null> {
    const key = usernameKey(username);
    const cached = this.cache.get(key);
    if (cached && cached.expires > this.now().getTime()) return cached.value;
    const value = await this.search(username);
    this.cache.set(key, { value, expires: this.now().getTime() + this.ttlMs });
    return value;
  }

  private async search(username: string): Promise<UsernameSuggestion | null> {
    const query = new URLSearchParams({ q: `${username} type:user`, per_page: '1' });
    try {
      const result = (await this.transport.getJson(`/search/users?${query}`)) as SearchUsers;
      const best = result?.items?.[0];
      if (!best || usernameKey(best.login) === usernameKey(username)) return null;
      return { username: best.login, avatarUrl: best.avatar_url };
    } catch {
      return null;
    }
  }
}
