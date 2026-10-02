import { describe, expect, it } from 'vitest';
import {
  compareAchievements,
  compareProfiles,
  comparePath,
  comparisonBlocker,
  isSelfComparison,
  leaderOf,
  parseComparePair,
} from '../../src/domain/compare.js';
import { alignYears } from '../../src/domain/compare-years.js';
import { compareVerdicts, sharedLanguages } from '../../src/domain/compare-verdicts.js';
import { deriveSnapshot } from '../../src/domain/snapshot.js';
import type { CollectedProfile, Repo } from '../../src/domain/types.js';
import { makeAccount, repoIn } from '../fakes/repo-factory.js';

const NOW = new Date('2026-09-30T00:00:00Z');

const snapshotFrom = (username: string, repos: Repo[], extra: Partial<CollectedProfile> = {}) =>
  deriveSnapshot(
    { account: makeAccount({ username }), repos, months: {}, orgContributions: [], ...extra },
    NOW,
  );

const snapshotOf = (username: string, repoCount: number, stars: number, firstYear = 2020) =>
  snapshotFrom(
    username,
    Array.from({ length: repoCount }, (_, index) =>
      repoIn(firstYear + index, { language: index % 2 ? 'Go' : 'Rust', stars }),
    ),
  );

describe('compareProfiles', () => {
  it('proporção relativa ao maior valor de cada métrica', () => {
    const rows = compareProfiles(snapshotOf('a', 2, 500), snapshotOf('b', 4, 1000));
    expect(rows.map((row) => row.label)).toEqual([
      'repositórios',
      'stars nos próprios',
      'anos de atividade',
      'linguagens',
    ]);
    expect(rows[0]).toMatchObject({ a: '2', b: '4', aRatio: 0.5, bRatio: 1, leader: 'b' });
    expect(rows[1]).toMatchObject({ a: '1k', b: '4k', aRatio: 0.25 });
    expect(rows[3]).toMatchObject({ aRatio: 1, bRatio: 1, leader: null });
  });

  it('não divide por zero', () => {
    const rows = compareProfiles(snapshotOf('a', 1, 0), snapshotOf('b', 1, 0));
    expect(rows[1]).toMatchObject({ aRatio: 0, bRatio: 0 });
  });
});

describe('leaderOf', () => {
  it.each([
    [3, 9, 'b'],
    [9, 3, 'a'],
    [4, 4, null],
  ])('%i × %i → %s', (a, b, leader) => {
    expect(leaderOf(a, b)).toBe(leader);
  });
});

describe('compareVerdicts', () => {
  it('descreve repositórios, stars, estreia e linguagens em comum', () => {
    const a = snapshotOf('a', 2, 900, 2018);
    const b = snapshotOf('b', 6, 100, 2020);
    expect(compareVerdicts(a, b)).toEqual([
      { side: 'b', text: 'criou 3× mais repositórios' },
      { side: 'a', text: 'tem 3× mais stars' },
      { side: 'a', text: 'começou 2 anos antes' },
      { side: null, text: '2 linguagens em comum' },
    ]);
  });

  it('omite diferenças pequenas e razões contra zero', () => {
    const a = snapshotOf('a', 4, 0);
    const b = snapshotOf('b', 5, 10);
    expect(compareVerdicts(a, b)).toEqual([
      { side: null, text: 'mesmo ano de estreia: 2020' },
      { side: null, text: '2 linguagens em comum' },
    ]);
  });
});

describe('sharedLanguages', () => {
  it('mantém a ordem de adoção de A', () => {
    const a = snapshotFrom('a', [
      repoIn(2018, { language: 'Go' }),
      repoIn(2019, { language: 'C' }),
      repoIn(2020, { language: 'Rust' }),
    ]);
    const b = snapshotFrom('b', [
      repoIn(2021, { language: 'Rust' }),
      repoIn(2022, { language: 'Go' }),
    ]);
    expect(sharedLanguages(a, b)).toEqual(['Go', 'Rust']);
    expect(
      compareVerdicts(a, snapshotFrom('c', [repoIn(2020, { language: 'Lua' })])),
    ).toContainEqual({ side: null, text: 'nenhuma linguagem em comum' });
  });
});

describe('alignYears', () => {
  it('cobre do primeiro ao último ano dos dois, sem buracos', () => {
    const a = snapshotFrom('a', [repoIn(2018), repoIn(2021)]);
    const b = snapshotFrom('b', [repoIn(2020)], {
      months: { 2020: [0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 1] },
    });
    const rows = alignYears(a, b);
    expect(rows.map((row) => row.year)).toEqual([2018, 2019, 2020, 2021]);
    expect(rows[1]?.a.era).toBeNull();
    expect(rows[1]?.a.months).toEqual(Array(12).fill(0));
    expect(rows[2]?.b.era?.year).toBe(2020);
    expect(rows[2]?.b.months[2]).toBe(5);
  });

  it('sem capítulos não há anos', () => {
    expect(alignYears(snapshotFrom('a', []), snapshotFrom('b', []))).toEqual([]);
  });
});

describe('compareAchievements', () => {
  it('segue o catálogo e marca cada lado', () => {
    const pairs = compareAchievements(snapshotOf('a', 1, 0), snapshotOf('b', 1, 150));
    expect(pairs[0]).toMatchObject({ id: 'primeiro-repo', a: true, b: true });
    expect(pairs.find((pair) => pair.id === 'stars-100')).toMatchObject({ a: false, b: true });
  });
});

describe('comparisonBlocker', () => {
  it('bloqueia organização e perfil sem repositórios', () => {
    const org = deriveSnapshot(
      {
        account: makeAccount({ username: 'org', type: 'Organization' }),
        repos: [repoIn(2020)],
        months: {},
        orgContributions: [],
      },
      NOW,
    );
    expect(comparisonBlocker(org)).toBe('organizacao');
    expect(comparisonBlocker(snapshotFrom('vazio', []))).toBe('vazio');
    expect(comparisonBlocker(snapshotOf('a', 1, 0))).toBeNull();
  });
});

describe('rota de comparação', () => {
  it('monta e lê `a...b`', () => {
    expect(comparePath('torvalds', 'gaearon')).toBe('/u/torvalds...gaearon');
    expect(parseComparePair('torvalds...gaearon')).toEqual(['torvalds', 'gaearon']);
    expect(parseComparePair('torvalds')).toBeNull();
    expect(parseComparePair('a......b')).toBeNull();
    expect(parseComparePair('...b')).toBeNull();
  });

  it('reconhece o mesmo perfil dos dois lados', () => {
    expect(isSelfComparison('Torvalds', 'torvalds')).toBe(true);
    expect(isSelfComparison('torvalds', 'gaearon')).toBe(false);
  });
});
