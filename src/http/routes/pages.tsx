import { Hono, type Context } from 'hono';
import { comparePath } from '../../domain/compare.js';
import { parseUsernameInput } from '../../domain/username.js';
import { LandingPage } from '../../views/landing-page.js';
import type { AppDeps } from '../context.js';
import { profilePage, themeOf } from './profile-page.js';

const SEARCH_ERROR = 'Digite um username do GitHub, @username ou a URL do perfil.';
const COMPARE_ERROR = 'Para comparar, digite dois usernames do GitHub.';

/** Páginas renderizadas no servidor: `/`, `/buscar`, `/comparar` e `/u/<username>`. */
export function pageRoutes(deps: AppDeps): Hono {
  const app = new Hono();
  app.get('/', (c) => landing(c, deps));
  app.get('/buscar', (c) => {
    const username = parseUsernameInput(c.req.query('q') ?? '');
    if (username) return c.redirect(`/u/${encodeURIComponent(username)}`, 302);
    return landing(c, deps, SEARCH_ERROR, 400);
  });
  app.get('/comparar', (c) => {
    const a = parseUsernameInput(c.req.query('a') ?? '');
    const b = parseUsernameInput(c.req.query('b') ?? '');
    if (a && b) return c.redirect(comparePath(a, b), 302);
    return landing(c, deps, COMPARE_ERROR, 400);
  });
  app.get('/u/:username', (c) => profilePage(c, deps));
  return app;
}

function landing(c: Context, deps: AppDeps, error?: string, status: 200 | 400 = 200) {
  deps.gallery.warmCurated();
  return c.html(
    <LandingPage
      theme={themeOf(c)}
      tabs={deps.gallery.tabs()}
      weeklyCount={deps.visits.weeklyCount()}
      projectStars={deps.projectStars.current()}
      error={error}
    />,
    status,
  );
}
