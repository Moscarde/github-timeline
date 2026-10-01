import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { parseComparePair } from '../../domain/compare.js';
import { formatAge } from '../../domain/format.js';
import { isValidUsername } from '../../domain/username.js';
import type { ProfileSnapshot } from '../../domain/snapshot.js';
import {
  parseTheme,
  resolveThemePreference,
  THEME_COOKIE,
  type ThemePreference,
} from '../../lib/theme.js';
import type { ProfileLookup } from '../../services/profile-service.js';
import { ProfilePage } from '../../views/profile-page.js';
import { CollectingPage, NotFoundPage, UnavailablePage } from '../../views/states/pages.js';
import type { StaleNotice } from '../../views/states/profile-states.js';
import { clientIp } from '../client-ip.js';
import { mayCollect } from '../collect-guard.js';
import type { AppDeps } from '../context.js';

const DEFAULT_COLLECT_WAIT_MS = 1500;
const RETRY_MIN_SECONDS = 30;
const RETRY_MAX_SECONDS = 600;

type PageLookup = ProfileLookup | { status: 'collecting' };

/**
 * `/u/<username>` e `/u/<a>...<b>`: o primeiro perfil que não estiver pronto decide o estado.
 * @example app.get('/u/:username', (c) => profilePage(c, deps));
 */
export async function profilePage(c: Context, deps: AppDeps) {
  const param = c.req.param('username') ?? '';
  const usernames = parseComparePair(param) ?? [param];
  const theme = themeOf(c);
  const invalid = usernames.find((username) => !isValidUsername(username));
  if (invalid !== undefined) return notFound(c, deps, invalid, theme);
  const blocked = firstBlocked(c, deps, usernames);
  if (blocked) return rateLimited(c, deps, blocked, theme);
  const waitMs = deps.collectWaitMs ?? DEFAULT_COLLECT_WAIT_MS;
  const lookups = await Promise.all(
    usernames.map((username) => lookupWithin(deps, username, waitMs)),
  );
  const pending = lookups.findIndex((lookup) => lookup.status !== 'ok');
  if (pending >= 0)
    return pendingState(c, deps, usernames[pending] ?? param, lookups[pending]!, theme);
  const [main, other] = lookups as Array<Extract<ProfileLookup, { status: 'ok' }>>;
  return renderProfile(c, deps, theme, main!, other?.snapshot);
}

function renderProfile(
  c: Context,
  deps: AppDeps,
  theme: ThemePreference,
  main: Extract<ProfileLookup, { status: 'ok' }>,
  compareWith: ProfileSnapshot | undefined,
) {
  deps.visits.record(main.snapshot.account.username, clientIp(c));
  const shareTheme = parseTheme(c.req.query('tema')) ?? (theme === 'auto' ? 'escuro' : theme);
  const stale = main.stale && deps.quota.isLow() ? staleNotice(deps, main.snapshot) : undefined;
  return c.html(
    <ProfilePage
      snapshot={main.snapshot}
      theme={theme}
      shareTheme={shareTheme}
      compareWith={compareWith}
      stale={stale}
    />,
  );
}

function pendingState(
  c: Context,
  deps: AppDeps,
  username: string,
  lookup: PageLookup,
  theme: ThemePreference,
) {
  if (lookup.status === 'collecting')
    return c.html(<CollectingPage username={username} theme={theme} />, 202);
  if (lookup.status === 'not_found') return notFound(c, deps, username, theme);
  const resetAt = lookup.status === 'unavailable' ? lookup.resetAt : null;
  return c.html(
    <UnavailablePage
      username={username}
      theme={theme}
      reason="cota"
      retryAt={formatTime(resetAt)}
      retryInSeconds={retryIn(deps, resetAt)}
    />,
    503,
  );
}

/** Primeiro username que dispararia coleta nova além do limite deste IP. */
function firstBlocked(c: Context, deps: AppDeps, usernames: string[]) {
  for (const username of usernames) {
    const gate = mayCollect(c, deps, username);
    if (!gate.allowed) return { username, retryInSeconds: gate.retryInSeconds };
  }
  return null;
}

function rateLimited(
  c: Context,
  deps: AppDeps,
  blocked: { username: string; retryInSeconds: number },
  theme: ThemePreference,
) {
  const retryAt = new Date(deps.now().getTime() + blocked.retryInSeconds * 1000);
  c.header('Retry-After', String(blocked.retryInSeconds));
  return c.html(
    <UnavailablePage
      username={blocked.username}
      theme={theme}
      reason="limite-ip"
      retryAt={formatTime(retryAt)}
      retryInSeconds={retryIn(deps, retryAt)}
    />,
    429,
  );
}

async function notFound(c: Context, deps: AppDeps, username: string, theme: ThemePreference) {
  const suggestion = isValidUsername(username) ? await deps.suggester.suggest(username) : null;
  return c.html(<NotFoundPage username={username} theme={theme} suggestion={suggestion} />, 404);
}

/** Perfil novo: espera um pouco pela coleta; se demorar, a página acompanha por SSE. */
function lookupWithin(deps: AppDeps, username: string, waitMs: number): Promise<PageLookup> {
  const timeout = new Promise<PageLookup>((resolve) =>
    setTimeout(() => resolve({ status: 'collecting' }), waitMs).unref(),
  );
  return Promise.race([deps.profiles.getProfile(username), timeout]);
}

function staleNotice(deps: AppDeps, snapshot: ProfileSnapshot): StaleNotice {
  const reading = deps.quota.current();
  return {
    age: formatAge(new Date(snapshot.generatedAt), deps.now()),
    retryAt: formatTime(reading ? new Date(reading.resetAt) : null),
  };
}

function retryIn(deps: AppDeps, resetAt: Date | null): number {
  if (!resetAt) return 60;
  const seconds = Math.ceil((resetAt.getTime() - deps.now().getTime()) / 1000);
  return Math.min(RETRY_MAX_SECONDS, Math.max(RETRY_MIN_SECONDS, seconds));
}

/**
 * Preferência de tema da página: `?tema=` vence o cookie (§8).
 * @example themeOf(c) // "auto"
 */
export function themeOf(c: Context): ThemePreference {
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
