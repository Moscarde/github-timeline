import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { deriveSnapshot } from '../../src/domain/snapshot.js';
import { LocaleContext } from '../../src/i18n/view.js';
import { YearByYear } from '../../src/views/compare/years.js';
import { ComparePage } from '../../src/views/compare-page.js';
import { TimelineYears } from '../../src/views/profile/timeline.js';
import { makeAccount, repoIn } from '../fakes/repo-factory.js';

const left = deriveSnapshot(
  {
    account: makeAccount({ username: 'left' }),
    repos: Array.from({ length: 8 }, (_, index) =>
      repoIn(2020, { name: `left-${index}`, language: 'TypeScript', topics: ['web'] }),
    ),
    months: { 2020: [100, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    orgContributions: [],
  },
  new Date('2026-01-01T00:00:00Z'),
);
const right = deriveSnapshot(
  {
    account: makeAccount({ username: 'right' }),
    repos: [repoIn(2021, { name: 'right-project', language: 'Go', description: 'Right details' })],
    months: { 2021: [10, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    orgContributions: [],
  },
  new Date('2026-01-01T00:00:00Z'),
);

describe('comparison year tabs', () => {
  it('loads the comparison timeline styles on the comparison page', async () => {
    const html = String(await (<ComparePage a={left} b={right} theme="auto" />));
    expect(html).toContain('rel="stylesheet" href="/assets/css/compare-years.css"');
  });

  it('starts with the existing summary selected and the detailed panel hidden', async () => {
    const html = String(await (<YearByYear a={left} b={right} />));
    expect(html).toContain('aria-controls="anos-resumo" aria-selected="true" tabindex="0"');
    expect(html).toContain('aria-controls="anos-detalhada" aria-selected="false" tabindex="-1"');
    expect(html).toContain('id="anos-resumo" aria-labelledby="aba-anos-resumo" tabindex="0">');
    expect(html).toContain(
      'id="anos-detalhada" aria-labelledby="aba-anos-detalhada" tabindex="0" hidden',
    );
    expect(html.match(/class="year-row"/g)).toHaveLength(2);
  });

  it('reuses each full profile timeline, including independent repository expansion and scale', async () => {
    const html = String(await (<YearByYear a={left} b={right} />));
    for (const snapshot of [left, right]) {
      const timeline = String(
        await (<TimelineYears eras={snapshot.timeline} months={snapshot.months} />),
      );
      expect(html).toContain(timeline);
      expect(html).toContain(`href="/u/${snapshot.account.username}"`);
    }
    expect(html).toContain('TypeScript');
    expect(html).toContain('web');
    expect(html).toContain('Right details');
    expect(html).toContain('+ 2 repositórios');
    expect(html.match(/class="mo l4"/g)).toHaveLength(2);
    expect(html.match(/class="mo l2"/g)).toHaveLength(2);
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps both profiles within the available width at every breakpoint', () => {
    const stylesheet = readFileSync(
      new URL('../../public/assets/css/compare-years.css', import.meta.url),
      'utf8',
    );
    const layoutRules = [...stylesheet.matchAll(/\.year-details\s*\{([^}]+)\}/g)];
    expect(layoutRules.length).toBeGreaterThan(0);
    for (const rule of layoutRules) {
      expect(rule[1]).not.toMatch(/grid-template-columns:\s*1fr\s*;/);
    }
    expect(stylesheet).toMatch(
      /\.year-details\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s,
    );
  });

  it('summarizes only comparison details on narrow screens', () => {
    const stylesheet = readFileSync(
      new URL('../../public/assets/css/compare-years.css', import.meta.url),
      'utf8',
    );
    expect(stylesheet).not.toContain('overflow-x: auto');
    const compactStyles = stylesheet.split('@media (max-width: 720px)')[1];
    expect(compactStyles).toBeDefined();
    const hiddenDetails = compactStyles?.match(/([^{}]+)\{\s*display: none;\s*\}/)?.[1];
    expect(hiddenDetails).toContain('.year-profile .lead');
    expect(hiddenDetails).toContain('.year-profile .topic-skill');
    expect(hiddenDetails).toContain('.year-profile .lang-skill:nth-child(n + 3)');
    expect(hiddenDetails).toContain('.year-profile .repo .desc');
    expect(hiddenDetails).not.toMatch(/\.year-profile \.(?:year|months|repo|name)\s*(?:,|$)/);
    expect(compactStyles).toMatch(/\.year-profile \.btn\.more\s*\{[^}]*white-space: normal/s);
  });

  it('translates both tab labels', async () => {
    const html = String(
      await (
        <LocaleContext.Provider value="en">
          <YearByYear a={left} b={right} />
        </LocaleContext.Provider>
      ),
    );
    expect(html).toContain('Summary</button>');
    expect(html).toContain('Detailed</button>');
  });
});
