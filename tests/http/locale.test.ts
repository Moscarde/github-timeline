import { describe, expect, it } from 'vitest';
import { createAppHarness } from '../fakes/app-harness.js';
import { localizedProfile } from '../fakes/localized-profile.js';
import { makeAccount } from '../fakes/repo-factory.js';

const englishHeaders = { 'Accept-Language': 'en-US,en;q=0.9,pt;q=0.8' };

describe('localized pages', () => {
  it('detects English and exposes an accessible language switcher without JavaScript', async () => {
    const { app } = createAppHarness();
    const response = await app.request('/', { headers: englishHeaders });
    const html = await response.text();
    expect(response.headers.get('content-language')).toBe('en');
    expect(response.headers.get('vary')).toContain('Cookie');
    expect(response.headers.get('cache-control')).toBe('private, no-cache');
    expect(html).toContain('<html lang="en"');
    expect(html).toContain('Every commit tells a story.');
    expect(html).toContain('Create timeline →');
    expect(html).toContain('1.2k</span>');
    expect(html).toContain('action="/idioma"');
    expect(html).toContain('<option value="en" selected="" lang="en">English</option>');
    expect(html).toContain('<noscript><button class="btn" type="submit">Apply</button></noscript>');
    expect(html).not.toContain('Todo commit conta');
  });

  it('falls back to Portuguese and respects saved preference and explicit links', async () => {
    const { app } = createAppHarness();
    expect(
      (await app.request('/', { headers: { 'Accept-Language': 'fr' } })).headers.get(
        'content-language',
      ),
    ).toBe('pt-BR');
    const saved = await app.request('/', {
      headers: { ...englishHeaders, Cookie: 'idioma=pt-BR' },
    });
    expect(await saved.text()).toContain('<html lang="pt-BR"');
    const linked = await app.request('/?lang=en', { headers: { Cookie: 'idioma=pt-BR' } });
    expect(linked.headers.get('content-language')).toBe('en');
    expect(linked.headers.get('set-cookie')).toContain('idioma=en');
  });

  it('localizes existing snapshots, headings, dates, counts and sharing without touching public text', async () => {
    const harness = createAppHarness();
    harness.addProfile(localizedProfile());
    await harness.app.request('/u/dev');
    const stored = JSON.stringify(harness.store.find('dev'));
    const html = await (await harness.app.request('/u/dev?lang=en')).text();
    expect(html).toContain('6 years. 2 repositories.');
    expect(html).toContain('1.2k ★ on Uma década.');
    expect(html).toContain('Your GitHub at a glance');
    expect(html).toContain('First repo');
    expect(html).toContain('Jun 2019');
    expect(html).toContain('1,234 public contributions');
    expect(html).toContain('Main language:');
    expect(html).toContain('on GitHub since');
    expect(html).toContain('Descrição em português &lt;&amp;&gt;');
    expect(html).toContain('Nome público &lt;&amp;&gt;');
    expect(html).toContain('/card.png?tema=escuro&amp;lang=en');
    expect(html).toContain('data-copied-label="Link copied ✓"');
    expect(JSON.stringify(harness.store.find('dev'))).toBe(stored);
    expect(harness.collector.calls).toBe(1);
  });

  it('localizes comparison labels, numeric values, verdicts and share messages', async () => {
    const harness = createAppHarness();
    harness.addProfile(localizedProfile('ana'));
    harness.addProfile(localizedProfile('bia'));
    const html = await (
      await harness.app.request('/u/ana...bia', { headers: englishHeaders })
    ).text();
    expect(html).toContain('Two GitHub journeys, year by year: @ana and @bia.');
    expect(html).toContain('Numbers');
    expect(html).toContain('1.3k');
    expect(html).toContain('same debut year: 2019');
    expect(html).toContain('2 shared languages');
    expect(html).toContain('lang=en');
    expect(html).not.toContain('1,3k');
    expect(html).not.toContain('repositórios');
  });

  it('translates not-found, empty, organization and validation states', async () => {
    const harness = createAppHarness();
    const missing = await harness.app.request('/u/ghost?lang=en');
    expect(missing.status).toBe(404);
    expect(await missing.text()).toContain('This profile does not exist.');
    harness.addProfile({ ...localizedProfile('empty'), repos: [] });
    expect(await (await harness.app.request('/u/empty?lang=en')).text()).toContain(
      'has no public repositories.',
    );
    harness.addProfile({
      ...localizedProfile('org'),
      account: makeAccount({ username: 'org', type: 'Organization' }),
    });
    expect(await (await harness.app.request('/u/org?lang=en')).text()).toContain(
      'Organizations do not have their own journey.',
    );
    const invalid = await harness.app.request('/buscar?q=&lang=en');
    expect(invalid.status).toBe(400);
    expect(await invalid.text()).toContain('Enter a GitHub username');
  });

  it('translates progress, quota and stale notices', async () => {
    const harness = createAppHarness(5);
    harness.addProfile(localizedProfile());
    harness.collector.hold();
    const collecting = await harness.app.request('/u/dev?lang=en');
    expect(collecting.status).toBe(202);
    expect(await collecting.text()).toContain('Building the timeline');
    harness.collector.open();
    await harness.app.request('/api/profile/dev');
    const stored = harness.store.find('dev')!;
    harness.store.save(
      { ...stored.snapshot, generatedAt: '2026-09-30T09:00:00Z' },
      new Date('2026-09-30T10:00:00Z'),
    );
    harness.quota.record({ limit: 5000, remaining: 1, resetAt: '2026-09-30T17:20:00Z' });
    const stale = await (await harness.app.request('/u/dev?lang=en')).text();
    expect(stale).toContain('Showing data from <b>3 hours ago</b>');
    const unavailable = await harness.app.request('/u/new?lang=en');
    expect(unavailable.status).toBe(503);
    expect(await unavailable.text()).toContain('Lots of people are looking at GitHub right now.');
  });

  it('renders concurrently in different languages without sharing request context', async () => {
    const harness = createAppHarness();
    harness.addProfile(localizedProfile());
    const [english, portuguese] = await Promise.all([
      harness.app.request('/u/dev?lang=en'),
      harness.app.request('/u/dev?lang=pt-BR'),
    ]);
    expect(await english.text()).toContain('6 years. 2 repositories.');
    expect(await portuguese.text()).toContain('6 anos. 2 repositórios.');
  });
});

describe('manual language selection', () => {
  it('saves preference and returns to the current page, keeping theme and anchor', async () => {
    const { app } = createAppHarness();
    const selected = await app.request('/idioma?language=en', {
      headers: { Referer: 'https://example.com/u/ana?tema=claro&lang=pt-BR#conquistas' },
    });
    expect(selected.status).toBe(303);
    expect(selected.headers.get('location')).toBe('/u/ana?tema=claro#conquistas');
    expect(selected.headers.get('set-cookie')).toContain('idioma=en');
    expect(selected.headers.get('set-cookie')).toContain('HttpOnly');
    const cookie = selected.headers.get('set-cookie')!.split(';')[0]!;
    expect(
      (
        await app.request('/', { headers: { Cookie: cookie, 'Accept-Language': 'pt-BR' } })
      ).headers.get('content-language'),
    ).toBe('en');
  });

  it('returns to Portuguese and can restore automatic detection', async () => {
    const { app } = createAppHarness();
    expect((await app.request('/idioma?language=pt-BR')).headers.get('set-cookie')).toContain(
      'idioma=pt-BR',
    );
    const automatic = await app.request('/idioma?language=auto');
    expect(automatic.headers.get('set-cookie')).toContain('Max-Age=0');
    expect(automatic.headers.get('location')).toBe('/');
    expect(
      (await app.request('/', { headers: englishHeaders })).headers.get('content-language'),
    ).toBe('en');
  });

  it('rejects unsupported selections and keeps redirects local', async () => {
    const { app } = createAppHarness();
    const invalid = await app.request('/idioma?language=fr');
    expect(invalid.status).toBe(400);
    expect(await invalid.text()).toContain('recebido "fr"; esperado pt-BR, en ou auto');
    const safe = await app.request('/idioma?language=en', {
      headers: { Referer: 'https://evil.example/path' },
    });
    expect(safe.headers.get('location')).toBe('/path');
    const malformed = await app.request('/idioma?language=en', {
      headers: { Referer: 'http://[' },
    });
    expect(malformed.headers.get('location')).toBe('/');
  });
});

describe('localized assets and API', () => {
  it('passes language to the renderer and varies caching appropriately', async () => {
    const harness = createAppHarness();
    harness.addProfile(localizedProfile());
    const english = await harness.app.request('/u/dev/card.png?lang=en');
    const portuguese = await harness.app.request('/u/dev/card.png', {
      headers: { Cookie: 'idioma=pt-BR' },
    });
    expect(harness.cards.locales).toEqual(['en', 'pt-BR']);
    expect(english.headers.get('content-language')).toBe('en');
    expect(english.headers.get('cache-control')).toBe('public, max-age=3600');
    expect(portuguese.headers.get('cache-control')).toBe('private, max-age=3600');
    const missing = await harness.app.request('/u/ghost/card.png?lang=en');
    expect(missing.status).toBe(404);
    expect(await missing.text()).toBe('card unavailable for this profile');
  });

  it('returns English API copy and missing-badge labels', async () => {
    const harness = createAppHarness();
    harness.addProfile(localizedProfile());
    const english = await harness.app.request('/api/profile/dev?lang=en');
    expect(await english.json()).toMatchObject({
      headline: { full: '6 years. 2 repositories. 1.2k ★ on Uma década.' },
    });
    const missing = await harness.app.request('/badge/ghost.svg?lang=en');
    expect(await missing.text()).toContain('not found');
    expect(missing.headers.get('content-language')).toBe('en');
  });
});

describe('localized validation errors', () => {
  it('explains invalid values and formats in English', async () => {
    const { app } = createAppHarness();
    const language = await app.request('/idioma?language=fr', { headers: englishHeaders });
    expect(await language.text()).toContain(
      'Invalid language: received "fr"; expected pt-BR, en, or auto.',
    );
    for (const path of ['/api/profile/-bad-', '/api/status/-bad-', '/u/-bad-/card.png']) {
      const response = await app.request(path + '?lang=en');
      expect(response.status).toBe(400);
      expect(await response.text()).toContain('Invalid username');
    }
  });
});
