import { describe, expect, it } from 'vitest';
import {
  distinctLanguageCount,
  languageShares,
  ownRepos,
  predominantLanguage,
  rankByCount,
} from '../../src/domain/languages.js';
import { repoIn } from '../fakes/repo-factory.js';

describe('languages', () => {
  it('ordena por contagem e desempata pela primeira ocorrência', () => {
    expect(rankByCount(['Rust', 'Go', null, 'Go', 'C'])).toEqual([
      ['Go', 2],
      ['Rust', 1],
      ['C', 1],
    ]);
  });

  it('empate de linguagem predominante fica com a que chegou antes (regressão: karpathy)', () => {
    const repos = [
      repoIn(2012, { language: 'JavaScript' }),
      repoIn(2011, { language: 'Python' }),
      repoIn(2012, { language: 'JavaScript' }),
      repoIn(2012, { language: 'Python' }),
    ];
    expect(predominantLanguage(repos)).toBe('Python');
  });

  it('ignora forks em ownRepos', () => {
    const repos = [repoIn(2020), repoIn(2020, { isFork: true })];
    expect(ownRepos(repos)).toHaveLength(1);
  });

  it('acha a linguagem predominante e conta distintas', () => {
    const repos = [
      repoIn(2020, { language: 'Go' }),
      repoIn(2021, { language: 'Go' }),
      repoIn(2021, { language: 'C' }),
    ];
    expect(predominantLanguage(repos)).toBe('Go');
    expect(distinctLanguageCount(repos)).toBe(2);
    expect(predominantLanguage([])).toBeNull();
  });

  it('agrupa o excedente em "Outras"', () => {
    const repos = ['A', 'A', 'B', 'C'].map((language) => repoIn(2020, { language }));
    expect(languageShares(repos, 2)).toEqual([
      { name: 'A', count: 2, ratio: 0.5 },
      { name: 'B', count: 1, ratio: 0.25 },
      { name: 'Outras', count: 1, ratio: 0.25 },
    ]);
    expect(languageShares([], 6)).toEqual([]);
  });
});
