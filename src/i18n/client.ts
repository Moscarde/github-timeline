import type { Locale } from './locale.js';
import { translate } from './translate.js';

const CLIENT_MESSAGES = [
  'Copiado ✓',
  'Selecione e copie',
  'Mostrar menos',
  'A coleta não terminou. Recarregue a página para tentar de novo.',
  'Username inválido: "{0}".',
  'Gerando a timeline de @{0}…',
  'Perfil @{0} não encontrado.',
  'Muitas timelines novas daqui. Tente de novo em alguns minutos.',
  'GitHub indisponível agora. Tente de novo em alguns minutos.',
] as const;

/** Supply client feedback from the same catalog as SSR. @example clientMessages('en')['Mostrar menos'] */
export function clientMessages(locale: Locale): Readonly<Record<string, string>> {
  return Object.fromEntries(CLIENT_MESSAGES.map((source) => [source, translate(source, locale)]));
}
