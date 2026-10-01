import { Hono, type Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { isValidLogin, parseLoginInput } from '../../domain/login.js';
import {
  parseTheme,
  resolveThemePreference,
  THEME_COOKIE,
  type ThemePreference,
} from '../../lib/theme.js';
import type { ProfileLookup } from '../../services/profile-service.js';
import { LandingPage } from '../../views/landing-page.js';
import { ProfilePage } from '../../views/profile-page.js';
import { CollectingPage, NotFoundPage, UnavailablePage } from '../../views/states.js';
import type { AppDeps } from '../context.js';

const DEFAULT_COLLECT_WAIT_MS = 1500;

/** Páginas renderizadas no servidor: `/`, `/buscar` e `/u/<login>`. */
export function pageRoutes(deps: AppDeps): Hono {
  const app = new Hono();
  app.get('/', (c) => c.html(<LandingPage theme={themeOf(c)} />));
  app.get('/buscar', (c) => {
    const login = parseLoginInput(c.req.query('q') ?? '');
    if (login) return c.redirect(`/u/${encodeURIComponent(login)}`, 302);
    return c.html(
      <LandingPage
        theme={themeOf(c)}
        error="Digite um login do GitHub, @login ou a URL do perfil."
      />,
      400,
    );
  });
  app.get('/u/:login', (c) => profilePage(c, deps));
  return app;
}

async function profilePage(c: Context, deps: AppDeps) {
  const login = c.req.param('login') ?? '';
  const theme = themeOf(c);
  if (!isValidLogin(login)) return c.html(<NotFoundPage login={login} theme={theme} />, 404);
  const lookup = await lookupWithin(deps, login, deps.collectWaitMs ?? DEFAULT_COLLECT_WAIT_MS);
  if (lookup === 'collecting')
    return c.html(<CollectingPage login={login} account={null} theme={theme} />, 202);
  if (lookup.status === 'not_found')
    return c.html(<NotFoundPage login={login} theme={theme} />, 404);
  if (lookup.status === 'unavailable')
    return c.html(
      <UnavailablePage login={login} theme={theme} retryAt={formatTime(lookup.resetAt)} />,
      503,
    );
  const shareTheme = parseTheme(c.req.query('tema')) ?? (theme === 'auto' ? 'escuro' : theme);
  return c.html(<ProfilePage snapshot={lookup.snapshot} theme={theme} shareTheme={shareTheme} />);
}

/** Perfil novo: espera um pouco pela coleta; se demorar, a página acompanha por SSE. */
function lookupWithin(
  deps: AppDeps,
  login: string,
  waitMs: number,
): Promise<ProfileLookup | 'collecting'> {
  const timeout = new Promise<'collecting'>((resolve) =>
    setTimeout(() => resolve('collecting'), waitMs).unref(),
  );
  return Promise.race([deps.profiles.getProfile(login), timeout]);
}

function themeOf(c: Context): ThemePreference {
  return resolveThemePreference(c.req.query('tema'), getCookie(c, THEME_COOKIE));
}

function formatTime(date: Date | null): string | null {
  if (!date) return null;
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}
