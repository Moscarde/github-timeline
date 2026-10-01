const LOGIN_PATTERN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const PROFILE_URL_PATTERN = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/?#\s]+)\/?(?:[?#].*)?$/i;

/** Verifica se o texto segue as regras de login do GitHub (1–39 caracteres, hífens internos). */
export function isValidLogin(candidate: string): boolean {
  return LOGIN_PATTERN.test(candidate);
}

/**
 * Extrai o login do campo de busca, que aceita `login`, `@login` e a URL do perfil.
 * Devolve `null` quando o texto não leva a um login válido.
 * @example parseLoginInput('https://github.com/torvalds') // "torvalds"
 */
export function parseLoginInput(input: string): string | null {
  const trimmed = input.trim();
  const fromUrl = PROFILE_URL_PATTERN.exec(trimmed)?.[1];
  const candidate = (fromUrl ?? trimmed).replace(/^@/, '');
  return isValidLogin(candidate) ? candidate : null;
}

/** Chave canônica de armazenamento: logins do GitHub não diferenciam maiúsculas. */
export function loginKey(login: string): string {
  return login.toLowerCase();
}
