import { message } from '../i18n/translate.js';
import type { Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import type { Child } from 'hono/jsx';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { LANGUAGE_COOKIE, parseLocale, resolveLocale, type Locale } from '../i18n/locale.js';
import { LocaleContext } from '../i18n/view.js';

/** Resolve language from URL, cookie, and browser. @example localeOf(c) // 'en' */
export function localeOf(c: Context): Locale {
  return resolveLocale(
    c.req.query('lang'),
    getCookie(c, LANGUAGE_COOKIE),
    c.req.header('Accept-Language'),
  );
}

/** Render each page inside its request's locale context. @example localizedHtml(c, <LandingPage />) */
export function localizedHtml(
  c: Context,
  content: Child,
  status: ContentfulStatusCode = 200,
): Response | Promise<Response> {
  const locale = localeOf(c);
  if (parseLocale(c.req.query('lang'))) saveLanguage(c, locale);
  c.header('Content-Language', locale);
  c.header('Vary', 'Accept-Language, Cookie');
  c.header('Cache-Control', 'private, no-cache');
  return c.html(<LocaleContext.Provider value={locale}>{content}</LocaleContext.Provider>, status);
}

/** Save an explicit selection and return to the same local page. @example changeLanguage(c) */
export function changeLanguage(c: Context): Response {
  const selected = c.req.query('language');
  if (selected === 'auto') deleteCookie(c, LANGUAGE_COOKIE, { path: '/' });
  else {
    const locale = parseLocale(selected);
    if (!locale) return invalidLanguage(c, selected);
    saveLanguage(c, locale);
  }
  const url = returnUrl(c.req.header('Referer'));
  url.searchParams.delete('lang');
  return c.redirect(`${url.pathname}${url.search}${url.hash}`, 303);
}

function returnUrl(referer: string | undefined): URL {
  const base = 'https://local.invalid';
  try {
    const url = new URL(referer ?? '/', base);
    return new URL(`${url.pathname}${url.search}${url.hash}`, base);
  } catch {
    return new URL('/', base);
  }
}

function saveLanguage(c: Context, locale: Locale): void {
  setCookie(c, LANGUAGE_COOKIE, locale, {
    path: '/',
    maxAge: 31536000,
    sameSite: 'Lax',
    httpOnly: true,
  });
}

function invalidLanguage(c: Context, selected: string | undefined): Response {
  const error = message(
    'Idioma inválido: recebido "{0}"; esperado pt-BR, en ou auto.',
    localeOf(c),
    [selected ?? 'undefined'],
  );
  return c.text(error, 400);
}
