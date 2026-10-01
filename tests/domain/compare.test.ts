import { describe, expect, it } from 'vitest';
import { compareProfiles, comparePath, parseComparePair } from '../../src/domain/compare.js';
import { deriveSnapshot } from '../../src/domain/snapshot.js';
import { makeAccount, repoIn } from '../fakes/repo-factory.js';

const snapshotOf = (username: string, repoCount: number, stars: number) =>
  deriveSnapshot(
    {
      account: makeAccount({ username }),
      repos: Array.from({ length: repoCount }, (_, index) =>
        repoIn(2020 + index, { language: index % 2 ? 'Go' : 'Rust', stars }),
      ),
      months: {},
      orgContributions: [],
    },
    new Date('2026-09-30T00:00:00Z'),
  );

describe('compareProfiles', () => {
  it('proporção relativa ao maior valor de cada métrica', () => {
    const rows = compareProfiles(snapshotOf('a', 2, 500), snapshotOf('b', 4, 1000));
    expect(rows.map((row) => row.label)).toEqual(['repositórios', 'stars', 'anos', 'linguagens']);
    expect(rows[0]).toMatchObject({ a: '2', b: '4', aRatio: 0.5, bRatio: 1 });
    expect(rows[1]).toMatchObject({ a: '1k', b: '4k', aRatio: 0.25 });
    expect(rows[3]).toMatchObject({ aRatio: 1, bRatio: 1 });
  });

  it('não divide por zero', () => {
    const rows = compareProfiles(snapshotOf('a', 1, 0), snapshotOf('b', 1, 0));
    expect(rows[1]).toMatchObject({ aRatio: 0, bRatio: 0 });
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
});
