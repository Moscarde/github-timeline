import { ENGLISH } from './messages.js';
import type { Locale } from './locale.js';

/** Translate application copy, preserving surrounding spaces. @example translate('Copiar', 'en') */
export function translate(source: string, locale: Locale): string {
  if (locale === 'pt-BR') return source;
  const key = source.replace(/\s+/g, ' ').trim();
  const translated = ENGLISH[source] ?? ENGLISH[key];
  if (translated === undefined) return source;
  return `${source.match(/^\s*/)?.[0] ?? ''}${translated.trim()}${source.match(/\s*$/)?.[0] ?? ''}`;
}

/** Interpolate after translation so GitHub content stays intact. @example message('às {0}', 'en', ['12:00']) */
export function message(
  source: string,
  locale: Locale,
  values: readonly (string | number)[],
): string {
  return translate(source, locale).replace(/\{(\d+)\}/g, (_, index: string) =>
    String(values[Number(index)] ?? ''),
  );
}
