import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { parseTheme, type Theme } from '../lib/theme.js';
import { localeOf } from './locale.js';

/**
 * Resposta SVG com cache e cabeçalhos de idioma, comum a embeds e prévias.
 * @example return svgResponse(c, svg, 200, 3600);
 */
export function svgResponse(
  c: Context,
  svg: string,
  status: ContentfulStatusCode,
  maxAge: number,
): Response {
  return c.body(svg, status, {
    'Content-Type': 'image/svg+xml; charset=utf-8',
    'Cache-Control': `max-age=${maxAge}`,
    'Content-Language': localeOf(c),
    Vary: 'Accept-Language, Cookie',
  });
}

/**
 * Tema do embed pela query `?tema=`; o padrão é escuro, como no card.
 * @example themeOf(c) // "claro"
 */
export function themeOf(c: Context): Theme {
  return parseTheme(c.req.query('tema')) ?? 'escuro';
}
