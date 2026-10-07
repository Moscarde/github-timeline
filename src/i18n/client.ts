import type { Locale } from './locale.js';
import { translate } from './translate.js';

const CLIENT_MESSAGES = [
  'Copiado ✓',
  'Selecione e copie',
  'Mostrar menos',
  'A coleta não terminou. Recarregue a página para tentar de novo.',
] as const;

/** Supply client feedback from the same catalog as SSR. @example clientMessages('en')['Mostrar menos'] */
export function clientMessages(locale: Locale): Readonly<Record<string, string>> {
  return Object.fromEntries(CLIENT_MESSAGES.map((source) => [source, translate(source, locale)]));
}
