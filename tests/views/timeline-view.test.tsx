import { describe, expect, it } from 'vitest';
import { deriveSnapshot } from '../../src/domain/snapshot.js';
import { contributionLevel } from '../../src/domain/contributions.js';
import { Timeline } from '../../src/views/profile/timeline.js';
import { makeAccount, repoIn } from '../fakes/repo-factory.js';

describe('Timeline view', () => {
  it('mostra todos os anos sem precisar expandir a linha do tempo', async () => {
    const repos = [2018, 2019, 2020, 2021, 2022, 2023].map((year) =>
      repoIn(year, { language: 'Go' }),
    );
    const snapshot = deriveSnapshot(
      { account: makeAccount(), repos, months: {}, orgContributions: [] },
      new Date('2026-01-01T00:00:00Z'),
    );
    const html = String(await (<Timeline eras={snapshot.timeline} months={snapshot.months} />));
    expect(html.match(/<li class="era[^"]*"[^>]*data-era/g)).toHaveLength(6);
    expect(html).not.toMatch(/<li class="era[^"]*"[^>]*hidden/);
    expect(html).not.toContain('data-more-eras');
    for (const year of [2018, 2019, 2020, 2021, 2022, 2023]) {
      expect(html).toContain(`<div class="year">${year}</div>`);
    }
    expect(html).not.toContain('title=');
    expect(html.match(/tabindex="0"/g)).toHaveLength(72);
  });

  it('mantém a expansão de repositórios dentro de cada ano', async () => {
    const repos = Array.from({ length: 8 }, (_, index) => repoIn(2020, { name: `repo-${index}` }));
    const snapshot = deriveSnapshot(
      { account: makeAccount(), repos, months: {}, orgContributions: [] },
      new Date('2026-01-01T00:00:00Z'),
    );
    const html = String(await (<Timeline eras={snapshot.timeline} months={snapshot.months} />));
    expect(html).toContain('class="repos more-repos" hidden=""');
    expect(html).toContain('data-toggle-repos');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('+ 2 repositórios');
    expect(html).not.toMatch(/<li class="era[^"]*"[^>]*hidden/);
  });
});

describe('contributionLevel', () => {
  it.each([
    [0, 100, 0],
    [1, 100, 1],
    [50, 100, 2],
    [100, 100, 4],
  ])('%i de %i → nível %i', (count, max, level) => {
    expect(contributionLevel(count, max)).toBe(level);
  });
});

describe('RepoCard em fork', () => {
  it('não exibe stars do fork', async () => {
    const repos = [repoIn(2020, { name: 'meu-fork', isFork: true, stars: 4321 })];
    const snapshot = deriveSnapshot(
      { account: makeAccount(), repos, months: {}, orgContributions: [] },
      new Date('2026-01-01T00:00:00Z'),
    );
    const html = String(await (<Timeline eras={snapshot.timeline} months={snapshot.months} />));
    expect(html).toContain('meu-fork');
    expect(html).not.toContain('4.321');
    expect(snapshot.stats.ownStars).toBe(0);
    expect(snapshot.stats.topRepo).toBeNull();
  });
});
