const USERNAME_PATTERN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const PROFILE_URL_PATTERN = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/?#\s]+)\/?(?:[?#].*)?$/i;

/** Verifica se o texto segue as regras de username do GitHub (1–39 caracteres, hífens internos). */
export function isValidUsername(candidate: string): boolean {
  return USERNAME_PATTERN.test(candidate);
}

/**
 * Extrai o username do campo de busca, que aceita `username`, `@username` e a URL do perfil.
 * Devolve `null` quando o texto não leva a um username válido.
 * @example parseUsernameInput('https://github.com/torvalds') // "torvalds"
 */
export function parseUsernameInput(input: string): string | null {
  const trimmed = input.trim();
  const fromUrl = PROFILE_URL_PATTERN.exec(trimmed)?.[1];
  const candidate = (fromUrl ?? trimmed).replace(/^@/, '');
  return isValidUsername(candidate) ? candidate : null;
}

/** Chave canônica de armazenamento: usernames do GitHub não diferenciam maiúsculas. */
export function usernameKey(username: string): string {
  return username.toLowerCase();
}
