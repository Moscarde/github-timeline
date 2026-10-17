import { describe, expect, it } from 'vitest';
import { deriveSnapshot } from '../../src/domain/snapshot.js';
import { LocaleContext } from '../../src/i18n/view.js';
import { YearByYear } from '../../src/views/compare/years.js';
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
