import { createContext, useContext } from 'hono/jsx';
import type { Locale } from './locale.js';
import { message, translate } from './translate.js';
import { translateStored } from './stored.js';

export const LocaleContext = createContext<Locale>('pt-BR');

/** Read the locale supplied by this request. @example useLocale() // 'en' */
export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** Translate static view copy. @example viewText('Copiar') */
export function viewText(source: string): string {
  return translate(source, useLocale());
}

/** Translate a view template before inserting values. @example viewMessage('às {0}', ['12:00']) */
export function viewMessage(source: string, values: readonly (string | number)[]): string {
  return message(source, useLocale(), values);
}

/** Localize copy in existing snapshots. @example storedText(snapshot.headline.opening) */
export function storedText(source: string): string {
  return translateStored(source, useLocale());
}
