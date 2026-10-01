import { describe, expect, it } from 'vitest';
import type { CollectedProfile } from '../../src/domain/types.js';
import { createAppHarness } from '../fakes/app-harness.js';
import { makeAccount, repoIn } from '../fakes/repo-factory.js';

function profile(login = 'dev', overrides: Partial<CollectedProfile> = {}): CollectedProfile {
  return {
    account: makeAccount({ login, name: 'Dev <script>alert(1)</script>' }),
    repos: [
      repoIn(2019, { name: 'site', language: 'HTML', homepage: 'javascript:alert(1)' }),
      repoIn(2024, { language: 'Go', stars: 3 }),
    ],
    months: { 2024: [1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 9] },
    orgContributions: [],
    ...overrides,
  };
}

describe('rotas de sistema e API', () => {
  it('GET /healthz', async () => {
    const { app } = createAppHarness();
    const response = await app.request('/healthz');
    expect(await response.json()).toEqual({ status: 'ok', quota: null });
  });

  it('GET /api/profile/<login> devolve o snapshot', async () => {
    const harness = createAppHarness();
    harness.addProfile(profile());
    const response = await harness.app.request('/api/profile/dev');
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ account: { login: 'dev' }, stale: false });
  });

  it('GET /api/profile valida login e 404', async () => {
    const { app } = createAppHarness();
    expect((await app.request('/api/profile/-x-')).status).toBe(400);
    expect((await app.request('/api/profile/ghost')).status).toBe(404);
  });

  it('GET /api/status sem coleta responde idle ou done', async () => {
    const harness = createAppHarness();
    expect(await (await harness.app.request('/api/status/dev')).text()).toContain('event: idle');
    harness.addProfile(profile());
    await harness.app.request('/api/profile/dev');
    expect(await (await harness.app.request('/api/status/dev')).text()).toContain('event: done');
  });

  it('aplica CSP restritiva', async () => {
    const { app } = createAppHarness();
    const csp = (await app.request('/')).headers.get('content-security-policy') ?? '';
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
  });
});

describe('badge', () => {
  it('serve SVG do snapshot com cache de 1 h', async () => {
    const harness = createAppHarness();
    harness.addProfile(profile());
    await harness.app.request('/api/profile/dev');
    const response = await harness.app.request('/badge/dev.svg');
    expect(response.headers.get('content-type')).toContain('image/svg+xml');
    expect(response.headers.get('cache-control')).toBe('max-age=3600');
    expect(await response.text()).toContain('Timeline · 2019–2024 · 2 repos');
  });

  it('login sem snapshot gera badge cinza com status 200', async () => {
    const { app } = createAppHarness();
    const response = await app.request('/badge/ghost.svg');
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('não encontrado');
  });
});

describe('páginas', () => {
  it('landing com busca', async () => {
    const { app } = createAppHarness();
    const html = await (await app.request('/')).text();
    expect(html).toContain('Gerar timeline');
    expect(html).toContain('/brand/logo-light.svg');
  });

  it('/buscar normaliza a entrada e redireciona', async () => {
    const { app } = createAppHarness();
    const response = await app.request(
      '/buscar?q=' + encodeURIComponent('https://github.com/torvalds'),
    );
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/u/torvalds');
    expect((await app.request('/buscar?q=%20')).status).toBe(400);
  });

  it('/u/<login> renderiza no servidor, com meta tags e conteúdo escapado', async () => {
    const harness = createAppHarness();
    harness.addProfile(profile());
    const html = await (await harness.app.request('/u/dev?tema=claro')).text();
    expect(html).toContain(
      '<meta property="og:image" content="https://github-timeline.frangolab.com/u/dev/card.png?tema=claro',
    );
    expect(html).toContain('summary_large_image');
    expect(html).toContain(
      '<link rel="canonical" href="https://github-timeline.frangolab.com/u/dev"',
    );
    expect(html).toContain('data-theme="light"');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).not.toContain('href="javascript:');
    expect(html).toContain('6 anos. 2 repositórios.');
  });

  it('tema vem do cookie quando não há query', async () => {
    const harness = createAppHarness();
    harness.addProfile(profile());
    const html = await (
      await harness.app.request('/u/dev', { headers: { cookie: 'tema=escuro' } })
    ).text();
    expect(html).toContain('data-theme="dark"');
  });

  it('login inexistente responde 404', async () => {
    const { app } = createAppHarness();
    const response = await app.request('/u/ghost');
    expect(response.status).toBe(404);
    expect(await response.text()).toContain('Perfil não encontrado');
  });

  it('perfil sem repositórios mostra "A história ainda não começou"', async () => {
    const harness = createAppHarness();
    harness.addProfile(profile('novo', { repos: [], months: {} }));
    expect(await (await harness.app.request('/u/novo')).text()).toContain(
      'A história ainda não começou',
    );
  });

  it('coleta lenta mostra o estado "coletando" com status 202', async () => {
    const harness = createAppHarness(5);
    harness.addProfile(profile());
    harness.collector.hold();
    const response = await harness.app.request('/u/dev');
    expect(response.status).toBe(202);
    expect(await response.text()).toContain('data-collecting="dev"');
    harness.collector.open();
  });

  it('GitHub indisponível responde 503', async () => {
    const harness = createAppHarness();
    harness.quota.record({ limit: 5000, remaining: 1, resetAt: '2026-09-30T13:00:00Z' });
    expect((await harness.app.request('/u/dev')).status).toBe(503);
  });
});

describe('card', () => {
  it('usa escuro e headline por padrão', async () => {
    const harness = createAppHarness();
    harness.addProfile(profile());
    const response = await harness.app.request('/u/dev/card.png');
    expect(response.headers.get('content-type')).toBe('image/png');
    expect(harness.cards.calls).toEqual([{ login: 'dev', theme: 'escuro', variant: 'headline' }]);
  });

  it('respeita ?tema= e ?variante=', async () => {
    const harness = createAppHarness();
    harness.addProfile(profile());
    await harness.app.request('/u/dev/card.png?tema=claro&variante=numero');
    expect(harness.cards.calls[0]).toMatchObject({ theme: 'claro', variant: 'numero' });
  });
});
