import { describe, expect, it } from 'vitest';
import { deriveSnapshot } from '../../src/domain/snapshot.js';
import { contributionLevel } from '../../src/domain/contributions.js';
import { Timeline } from '../../src/views/profile/timeline.js';
import { makeAccount, repoIn } from '../fakes/repo-factory.js';

describe('Timeline view', () => {
  it('mostra 4 anos e o botão para os demais', async () => {
    const repos = [2018, 2019, 2020, 2021, 2022, 2023].map((year) =>
      repoIn(year, { language: 'Go' }),
    );
    const snapshot = deriveSnapshot(
      { account: makeAccount(), repos, months: {}, orgContributions: [] },
      new Date('2026-01-01T00:00:00Z'),
    );
    const html = String(await (<Timeline eras={snapshot.timeline} months={snapshot.months} />));
    expect(html.match(/<li class="era[^"]*" hidden=""/g)).toHaveLength(2);
    expect(html).toContain('Ver 2022 – 2023');
    expect(html).not.toContain('title=');
    expect(html.match(/tabindex="0"/g)).toHaveLength(72);
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
