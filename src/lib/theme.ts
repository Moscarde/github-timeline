export type Theme = 'escuro' | 'claro';
/** Sem preferência salva, a página segue o sistema; o card usa escuro. */
export type ThemePreference = Theme | 'auto';

export const THEME_COOKIE = 'tema';

/**
 * Converte `?tema=` ou o cookie em tema; valores desconhecidos viram `null`.
 * @example parseTheme('claro') // "claro"
 */
export function parseTheme(raw: string | undefined | null): Theme | null {
  return raw === 'escuro' || raw === 'claro' ? raw : null;
}

/**
 * Preferência da página: query tem prioridade sobre o cookie (§8, "Tema").
 * @example resolveThemePreference(undefined, 'escuro') // "escuro"
 */
export function resolveThemePreference(
  query: string | undefined,
  cookie: string | undefined,
): ThemePreference {
  return parseTheme(query) ?? parseTheme(cookie) ?? 'auto';
}
