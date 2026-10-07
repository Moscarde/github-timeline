import { describe, expect, it } from 'vitest';
import type { CollectedProfile } from '../../src/domain/types.js';
import { createAppHarness } from '../fakes/app-harness.js';
import { makeAccount, repoIn } from '../fakes/repo-factory.js';

function profile(username = 'dev', overrides: Partial<CollectedProfile> = {}): CollectedProfile {
  return {
    account: makeAccount({ username, name: 'Dev <script>alert(1)</script>' }),
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

  it('GET /api/profile/<username> devolve o snapshot', async () => {
    const harness = createAppHarness();
    harness.addProfile(profile());
    const response = await harness.app.request('/api/profile/dev');
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ account: { username: 'dev' }, stale: false });
  });

  it('GET /api/profile valida username e 404', async () => {
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
    expect(await response.text()).toContain('2019–2024 · 2 repos');
  });

  it('username sem snapshot gera badge cinza com status 200', async () => {
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
    expect(html).toContain('Todo commit conta uma história.');
    expect(html).toContain('★ Star<span class="star-count">1,2k</span>');
    expect(html).toContain('<img class="mark brand-mark" src="/favicon.svg"');
    expect(html).not.toContain('<span class="mark"');
  });

  it('toda página começa com doctype para não cair em quirks mode', async () => {
    const harness = createAppHarness();
    harness.addProfile(profile());
    harness.addProfile(profile('ana'));
    for (const path of ['/', '/u/dev', '/u/novo', '/u/dev...ana']) {
      const html = await (await harness.app.request(path)).text();
      expect(html, path).toMatch(/^<!doctype html><html /);
    }
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

  it('/u/<username> renderiza no servidor, com meta tags e conteúdo escapado', async () => {
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
    expect(html).toContain('6 anos. 2 repositórios. <span class="ink">');
  });

  it('tema vem do cookie quando não há query', async () => {
    const harness = createAppHarness();
    harness.addProfile(profile());
    const html = await (
      await harness.app.request('/u/dev', { headers: { cookie: 'tema=escuro' } })
    ).text();
    expect(html).toContain('data-theme="dark"');
  });

  it('username inexistente responde 404', async () => {
    const { app } = createAppHarness();
    const response = await app.request('/u/ghost');
    expect(response.status).toBe(404);
    expect(await response.text()).toContain('Esse perfil não existe.');
  });

  it('perfil sem repositórios mostra "A história ainda não começou"', async () => {
    const harness = createAppHarness();
    harness.addProfile(profile('novo', { repos: [], months: {} }));
    expect(await (await harness.app.request('/u/novo')).text()).toContain(
      'A história ainda <span class="ink">não começou.</span>',
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
    expect(harness.cards.calls).toEqual([
      { username: 'dev', theme: 'escuro', variant: 'headline' },
    ]);
  });

  it('respeita ?tema= e ?variante=', async () => {
    const harness = createAppHarness();
    harness.addProfile(profile());
    await harness.app.request('/u/dev/card.png?tema=claro&variante=numero');
    expect(harness.cards.calls[0]).toMatchObject({ theme: 'claro', variant: 'numero' });
  });
});

describe('features do redesign', () => {
  it('/comparar redireciona para /u/<a>...<b>', async () => {
    const { app } = createAppHarness();
    const response = await app.request('/comparar?a=%40torvalds&b=gaearon');
    expect(response.headers.get('location')).toBe('/u/torvalds...gaearon');
    expect((await app.request('/comparar?a=torvalds')).status).toBe(400);
  });

  it('/u/<a>...<b> é uma página do par, não o perfil de A', async () => {
    const harness = createAppHarness();
    harness.addProfile(profile('ana'));
    harness.addProfile(profile('bia', { repos: [repoIn(2020)] }));
    const html = await (await harness.app.request('/u/ana...bia')).text();
    expect(html).toContain('<title>ana vs bia · GitHub Timeline</title>');
    expect(html).toContain('<meta name="robots" content="noindex"/>');
    expect(html).toContain('href="https://github-timeline.frangolab.com/u/ana...bia"');
    expect(html).not.toContain('og:image');
    expect(html).toContain(
      'data-copy-text="https://github-timeline.frangolab.com/u/ana...bia?lang=pt-BR"',
    );
    expect(html).toContain('href="/u/bia...ana"');
    expect(html).toContain('id="ano-a-ano"');
    expect(html).not.toContain('id="linha-do-tempo"');
    expect(html).not.toContain('data-share="card"');
  });

  it('comparação não conta visita para nenhum dos dois', async () => {
    const harness = createAppHarness();
    harness.addProfile(profile('ana'));
    harness.addProfile(profile('bia'));
    await harness.app.request('/u/ana...bia');
    expect(harness.visitStore.rows.size).toBe(0);
  });

  it('o mesmo perfil dos dois lados volta para o perfil', async () => {
    const { app } = createAppHarness();
    const response = await app.request('/u/Ana...ana');
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/u/Ana');
  });

  it('organização num dos lados explica que não dá pra comparar', async () => {
    const harness = createAppHarness();
    harness.addProfile(profile('ana'));
    harness.addProfile(
      profile('acme', { account: makeAccount({ username: 'acme', type: 'Organization' }) }),
    );
    const html = await (await harness.app.request('/u/ana...acme')).text();
    expect(html).toContain('@acme é uma organização.');
    expect(html).not.toContain('id="ano-a-ano"');
  });

  it('perfil oferece comparar com outro, com o próprio username fixo', async () => {
    const harness = createAppHarness();
    harness.addProfile(profile('ana'));
    const html = await (await harness.app.request('/u/ana')).text();
    expect(html).toContain('<input type="hidden" name="a" value="ana"/>');
    expect(html).toContain('action="/comparar"');
    expect(html).not.toContain('id="comparar-titulo"');
  });

  it('comparação com perfil inexistente responde 404 desse username', async () => {
    const harness = createAppHarness();
    harness.addProfile(profile('ana'));
    const response = await harness.app.request('/u/ana...ghost');
    expect(response.status).toBe(404);
    expect(await response.text()).toContain('404 · github.com/ghost');
  });

  it('404 sugere um username parecido', async () => {
    const harness = createAppHarness();
    harness.suggester.suggestions.set('torvaldz', {
      username: 'torvalds',
      avatarUrl: 'https://avatars.githubusercontent.com/u/1024025',
    });
    const html = await (await harness.app.request('/u/torvaldz')).text();
    expect(html).toContain('Você quis dizer:');
    expect(html).toContain('href="/u/torvalds"');
  });

  it('snapshot vencido com cota baixa mostra a faixa de aviso', async () => {
    const harness = createAppHarness();
    harness.addProfile(profile());
    await harness.app.request('/api/profile/dev');
    const stored = harness.store.find('dev')!;
    const old = { ...stored.snapshot, generatedAt: '2026-09-30T09:00:00Z' };
    harness.store.save(old, new Date('2026-09-30T10:00:00Z'));
    harness.quota.record({ limit: 5000, remaining: 1, resetAt: '2026-09-30T17:20:00Z' });
    const html = await (await harness.app.request('/u/dev')).text();
    expect(html).toContain('Mostrando dados de <b>há 3 horas</b>');
    expect(html).toContain('<b>14:20</b>');
  });

  it('organização lista quem mais contribuiu', async () => {
    const harness = createAppHarness();
    harness.addProfile(
      profile('acme', {
        account: makeAccount({ username: 'acme', name: 'Acme', type: 'Organization' }),
        repos: [],
        people: [{ username: 'ana', avatarUrl: 'https://a/1', contributions: 1234 }],
      }),
    );
    const html = await (await harness.app.request('/u/acme')).text();
    expect(html).toContain('Veja quem fez o Acme.');
    expect(html).toContain('1.234 commits');
  });

  it('visitas alimentam o contador semanal e "Em alta"', async () => {
    const harness = createAppHarness();
    harness.addProfile(profile());
    await harness.app.request('/u/dev', { headers: { 'x-forwarded-for': '203.0.113.7' } });
    const html = await (await harness.app.request('/')).text();
    expect(html).toContain('1<span class="live-long"> timelines geradas</span> esta semana');
    expect(html).toContain('href="/u/dev"');
  });
});

describe('limite de coletas novas por IP', () => {
  const fromIp = { headers: { 'x-forwarded-for': '203.0.113.7' } };

  it('responde 429 acima do limite, mas perfis salvos continuam abrindo', async () => {
    const harness = createAppHarness(50, 1);
    harness.addProfile(profile('ana'));
    harness.addProfile(profile('bia'));
    expect((await harness.app.request('/u/ana', fromIp)).status).toBe(200);
    const blocked = await harness.app.request('/u/bia', fromIp);
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('retry-after')).toBe('600');
    expect(await blocked.text()).toContain('Calma: muitas timelines novas daqui.');
    expect((await harness.app.request('/u/ana', fromIp)).status).toBe(200);
    expect((await harness.app.request('/api/profile/bia', fromIp)).status).toBe(429);
    expect((await harness.app.request('/u/bia/card.png', fromIp)).status).toBe(429);
  });

  it('badge acima do limite não dispara coleta e segue com 200', async () => {
    const harness = createAppHarness(50, 1);
    harness.addProfile(profile('ana'));
    harness.addProfile(profile('bia'));
    await harness.app.request('/u/ana', fromIp);
    const response = await harness.app.request('/badge/bia.svg', fromIp);
    expect(response.status).toBe(200);
    expect(harness.collector.calls).toBe(1);
  });
});
