import { describe, expect, it } from 'vitest';
import { activeYears, buildTimeline, repoScore } from '../../src/domain/timeline.js';
import { repoIn } from '../fakes/repo-factory.js';

const months12 = (value: number) => Array<number>(12).fill(value);

describe('buildTimeline', () => {
  it('títula o primeiro ano com "Começo com" e os seguintes com "Entram"', () => {
    const repos = [
      repoIn(2019, { language: 'HTML', topics: ['html', 'portfolio'] }),
      repoIn(2020, { language: 'Python', topics: ['python', 'pandas'] }),
      repoIn(2021, { language: 'Python' }),
    ];
    const eras = buildTimeline({ repos, months: {}, recordYear: 2019 });
    expect(eras.map((era) => era.title)).toEqual([
      'Começo com HTML e portfolio',
      'Entram Python e pandas',
      'Consolidação em Python',
    ]);
    expect(eras[0]?.isRecord).toBe(true);
    expect(eras[1]?.newTopics).toEqual(['pandas']);
  });

  it('inclui anos só com contribuições', () => {
    const eras = buildTimeline({
      repos: [repoIn(2020)],
      months: { 2022: months12(1) },
      recordYear: 2020,
    });
    expect(eras.map((era) => era.year)).toEqual([2020, 2022]);
    expect(eras[1]?.title).toBe('Sem repositórios novos');
    expect(eras[1]?.summary.contributions).toBe(12);
  });

  it('resume o ano e marca o mais estrelado', () => {
    const repos = [
      repoIn(2020, { name: 'a', language: 'Go', stars: 5 }),
      repoIn(2020, { name: 'b', language: 'Go', stars: 50 }),
      repoIn(2020, { name: 'c', isFork: true, stars: 500 }),
    ];
    const [era] = buildTimeline({ repos, months: {}, recordYear: null });
    expect(era?.summary).toMatchObject({
      repoCount: 3,
      forkCount: 1,
      topLanguage: { name: 'Go', count: 2, of: 2 },
      mostStarred: { name: 'b', stars: 50 },
      contributions: null,
    });
    expect(era?.mostStarredName).toBe('b');
  });
});

describe('repoScore', () => {
  it('ignora stars de forks', () => {
    const fork = repoIn(2020, { isFork: true, stars: 0 });
    expect(repoScore({ ...fork, stars: 5000 })).toBe(repoScore(fork));
  });

  it('penaliza forks e arquivados', () => {
    const base = repoIn(2020, { stars: 1 });
    expect(repoScore({ ...base, isFork: true })).toBeLessThan(repoScore(base));
    expect(repoScore({ ...base, archived: true })).toBeLessThan(repoScore(base));
  });
});

describe('activeYears', () => {
  it('ignora anos de contribuição zerados', () => {
    expect(activeYears([repoIn(2021)], { 2019: months12(0), 2023: months12(2) })).toEqual([
      2021, 2023,
    ]);
  });
});
