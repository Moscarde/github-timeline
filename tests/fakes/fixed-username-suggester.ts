import type { UsernameSuggester, UsernameSuggestion } from '../../src/github/username-suggester.js';

/** Sugestões configuradas por username digitado; sem entrada, nenhuma sugestão. */
export class FixedUsernameSuggester implements UsernameSuggester {
  readonly suggestions = new Map<string, UsernameSuggestion>();

  async suggest(username: string): Promise<UsernameSuggestion | null> {
    return this.suggestions.get(username.toLowerCase()) ?? null;
  }
}
