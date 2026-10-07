export type Locale = 'pt-BR' | 'en';
export const LANGUAGE_COOKIE = 'idioma';

/** Recognize supported language tags. @example parseLocale('en-US') // 'en' */
export function parseLocale(value: string | undefined): Locale | null {
  if (!value) return null;
  if (/^pt(?:-[a-z0-9]+)*$/i.test(value)) return 'pt-BR';
  if (/^en(?:-[a-z0-9]+)*$/i.test(value)) return 'en';
  return null;
}

/** Honor browser preference weights. @example browserLocale('en;q=0.9,pt;q=1') */
export function browserLocale(header: string | undefined): Locale {
  const preferences = (header ?? '').split(',').map(languagePreference);
  const supported = preferences.filter((item) => item.locale && item.weight > 0);
  supported.sort((a, b) => b.weight - a.weight);
  return supported[0]?.locale ?? 'pt-BR';
}

function languagePreference(value: string): { locale: Locale | null; weight: number } {
  const [tag, ...parameters] = value.trim().split(';');
  const quality = parameters.find((parameter) => parameter.trim().startsWith('q='));
  const weight = quality ? Number(quality.trim().slice(2)) : 1;
  return {
    locale: parseLocale(tag?.trim()),
    weight: Number.isFinite(weight) && weight <= 1 ? weight : 0,
  };
}

/** Explicit links win over saved preference and browser. @example resolveLocale('en', 'pt', '') */
export function resolveLocale(
  query: string | undefined,
  cookie: string | undefined,
  header: string | undefined,
): Locale {
  return parseLocale(query) ?? parseLocale(cookie) ?? browserLocale(header);
}
