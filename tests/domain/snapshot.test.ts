import { describe, expect, it } from 'vitest';
import { buildStats, deriveSnapshot, SNAPSHOT_VERSION } from '../../src/domain/snapshot.js';
import { makeAccount, repoIn } from '../fakes/repo-factory.js';

describe('deriveSnapshot', () => {
  it('monta todas as partes com a versão atual', () => {
    const repos = [
      repoIn(2015, { language: 'Go', stars: 3 }),
      repoIn(2018, { language: 'Go', isFork: true }),
    ];
    const snapshot = deriveSnapshot(
      {
        account: makeAccount(),
        repos,
        months: { 2026: Array<number>(12).fill(1) },
        orgContributions: [],
      },
      new Date('2026-09-30T00:00:00Z'),
    );
    expect(snapshot.version).toBe(SNAPSHOT_VERSION);
    expect(snapshot.stats).toMatchObject({
      firstYear: 2015,
      lastYear: 2018,
      activeYears: 4,
      ownRepos: 1,
      forks: 1,
      ownStars: 3,
    });
    expect(snapshot.headline.full).toBe('4 anos. 2 repositórios. Fiel ao Go desde 2015.');
    expect(snapshot.timeline.map((era) => era.year)).toEqual([2015, 2018, 2026]);
    expect(snapshot.achievements).toHaveLength(9);
  });
});

describe('buildStats', () => {
  it('conta anos pelos repositórios, não pelas contribuições (regressão: tj, 13 anos)', () => {
    const repos = [repoIn(2008), repoIn(2020)];
    expect(buildStats(repos)).toMatchObject({ firstYear: 2008, lastYear: 2020, activeYears: 13 });
  });

  it('zera para perfil sem atividade', () => {
    expect(buildStats([])).toMatchObject({ activeYears: 0, firstYear: null, topRepo: null });
  });
});
