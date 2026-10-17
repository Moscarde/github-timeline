import { describe, expect, it } from 'vitest';
import { createAppHarness } from '../fakes/app-harness.js';

function statisticsHarness() {
  const harness = createAppHarness();
  harness.visitStore.record({
    username: 'Dev',
    day: '2026-09-30',
    visitor: 'private-visitor-hash',
  });
  harness.visitStore.record({
    username: 'dev',
    day: '2026-09-30',
    visitor: 'private-visitor-hash',
  });
  harness.visitStore.record({ username: 'older', day: '2026-09-01', visitor: 'older-secret-hash' });
  harness.visitStore.recordEvent({ day: '2026-09-30', event: 'search', status: 302, locale: 'en' });
  return harness;
}

describe('public statistics dashboard', () => {
  it('renders live KPIs, a chart, exact values and a public profile ranking', async () => {
    const { app, collector } = statisticsHarness();
    const response = await app.request('/estatisticas');
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('3 timelines geradas no total.');
    expect(html).toContain('Perfis explorados');
    expect(html).toContain('points="');
    expect(html).toContain('datetime="2026-09-30"');
    expect(html).toContain('href="/u/dev"');
    expect(html).toContain('Ver valores por dia');
    expect(html).toContain('/assets/css/statistics.css');
    expect(html).toContain('aria-current="page">30 dias');
    expect(collector.calls).toBe(0);
  });

  it('contains no visitor hashes, IPs, raw events or request query values', async () => {
    const { app } = statisticsHarness();
    const html = await (
      await app.request('/estatisticas?visitor=private-query-value', {
        headers: { 'x-forwarded-for': '203.0.113.254' },
      })
    ).text();
    for (const secret of [
      'private-visitor-hash',
      'older-secret-hash',
      '203.0.113.254',
      'private-query-value',
      'username_key',
      '"visitor"',
      '"status":',
    ]) {
      expect(html).not.toContain(secret);
    }
    expect(html).toContain('@dev');
  });

  it('changes period KPIs and ranks together, leaving the all-time total intact', async () => {
    const { app } = statisticsHarness();
    const week = await (await app.request('/estatisticas?dias=7')).text();
    const quarter = await (await app.request('/estatisticas?dias=90')).text();
    expect(week).not.toContain('href="/u/older"');
    expect(quarter).toContain('href="/u/older"');
    expect(week).toContain('aria-current="page">7 dias');
    expect(quarter).toContain('aria-current="page">90 dias');
    expect(week).toContain('3 timelines geradas no total.');
    expect(quarter).toContain('3 timelines geradas no total.');
    expect(week.match(/<time datetime=/g)).toHaveLength(7);
    expect(quarter.match(/<time datetime=/g)).toHaveLength(90);
  });

  it('handles empty history and invalid period parameters without fabricated activity', async () => {
    const { app } = createAppHarness();
    const html = await (await app.request('/estatisticas?dias=invalid')).text();
    expect(html).toContain('0 timelines geradas no total.');
    expect(html).toContain('Nenhuma abertura registrada neste período.');
    expect(html).toContain('O próximo perfil pode ser o primeiro.');
    expect(html).not.toContain('<polyline');
    expect(html).toContain('aria-current="page">30 dias');
  });

  it('uses the shared theme and English translation, including UTC date labels', async () => {
    const { app } = statisticsHarness();
    const html = await (await app.request('/estatisticas?lang=en&tema=claro')).text();
    expect(html).toContain('lang="en" data-theme="light"');
    expect(html).toContain('Usage statistics');
    expect(html).toContain('3 timelines created in total.');
    expect(html).toContain('Most viewed profiles');
    expect(html).toContain('Sep 30');
    expect(html).toContain('30 days');
  });

  it('links from the landing footer and records dashboard views separately', async () => {
    const { app, visitStore } = statisticsHarness();
    const html = await (await app.request('/')).text();
    expect(html).toContain('href="/estatisticas"');
    await app.request('/estatisticas');
    expect(visitStore.totalCount()).toBe(3);
    expect(visitStore.events.at(-1)).toMatchObject({ event: 'statistics', status: 200 });
  });
});
