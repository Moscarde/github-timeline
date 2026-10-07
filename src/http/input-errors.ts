import type { Locale } from '../i18n/locale.js';
import { message } from '../i18n/translate.js';

const USERNAME_ERROR =
  'username inválido: recebido "{0}"; esperado username do GitHub com letras, números e hífens, sem hífen nas extremidades.';

/** Explain the rejected username in the request language. @example usernameError('-dev-', 'en') */
export function usernameError(username: string, locale: Locale): string {
  return message(USERNAME_ERROR, locale, [username]);
}
