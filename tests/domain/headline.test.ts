import { describe, expect, it } from 'vitest';
import { buildHeadline } from '../../src/domain/headline.js';
import type { Repo } from '../../src/domain/types.js';
import { makeOrgContribution, repoIn } from '../fakes/repo-factory.js';

const headlineOf = (repos: Repo[], activeYears = 6, orgContributions = []) =>
  buildHeadline({ repos, activeYears, orgContributions });

describe('buildHeadline', () => {
  it('estrela: repo com ≥1.000★ e ≥40% das stars', () => {
    const repos = [
      repoIn(2011, { name: 'linux', language: 'C', stars: 250712 }),
      repoIn(2012, { stars: 900 }),
    ];
    const headline = headlineOf(repos, 16);
    expect(headline.form).toBe('estrela');
    expect(headline.full).toBe('16 anos. 2 repositórios. 250,7k ★ em linux.');
    expect(headline.short).toBe('16 anos de código. 250,7k ★ em linux.');
    expect(headline.opening).toBe('16 anos. 2 repositórios.');
    expect(headline.shortOpening).toBe('16 anos de código.');
  });

  it('não é estrela quando o repo tem menos de 40% das stars', () => {
    const repos = [
      repoIn(2011, { stars: 1000, language: 'C' }),
      repoIn(2012, { stars: 2000, language: 'C' }),
    ];
    expect(headlineOf(repos).form).toBe('estrela');
    const spread = [1000, 1000, 1000].map((stars) => repoIn(2012, { stars, language: 'C' }));
    expect(headlineOf(spread).form).not.toBe('estrela');
  });

  it('transição por linguagem', () => {
    const repos = [
      repoIn(2010, { language: 'Ruby' }),
      repoIn(2011, { language: 'Ruby' }),
      repoIn(2020, { language: 'Go' }),
      repoIn(2021, { language: 'Go' }),
    ];
    expect(headlineOf(repos, 13).full).toBe('13 anos. 4 repositórios. De Ruby a Go.');
  });

  it('transição por topic de framework novo em ≥2 repos', () => {
    const repos = [
      repoIn(2020, { language: 'HTML' }),
      repoIn(2021, { language: 'HTML' }),
      repoIn(2024, { language: 'Python', topics: ['django'] }),
      repoIn(2025, { language: 'HTML', topics: ['django', 'api'] }),
    ];
    expect(headlineOf(repos).closing).toBe('De HTML a Django.');
  });

  it('framework que já aparecia antes do período recente não conta', () => {
    const repos = [
      repoIn(2020, { language: 'HTML', topics: ['django'] }),
      repoIn(2021, { language: 'HTML' }),
      repoIn(2024, { language: 'Python', topics: ['django'] }),
      repoIn(2025, { language: 'Python', topics: ['django'] }),
    ];
    expect(headlineOf(repos).closing).toBe('De HTML a Python.');
  });

  it('desempata frameworks por contagem e depois nome', () => {
    const repos = [
      repoIn(2019, { language: 'JavaScript' }),
      repoIn(2020, { language: 'JavaScript' }),
      repoIn(2024, { language: 'JavaScript', topics: ['vue', 'react'] }),
      repoIn(2025, { language: 'JavaScript', topics: ['vuejs', 'reactjs'] }),
    ];
    expect(headlineOf(repos).closing).toBe('De JavaScript a React.');
  });

  it('transição pelas contribuições em organizações (regressão: yyx990803)', () => {
    const repos = [2008, 2009, 2024, 2025].map((year) => repoIn(year, { language: 'JavaScript' }));
    const org = [
      makeOrgContribution({ year: 2025, language: 'Vue', commits: 300 }),
      makeOrgContribution({ year: 2025, language: 'JavaScript', commits: 20 }),
      makeOrgContribution({ year: 2015, language: 'Go', commits: 999 }),
    ];
    expect(buildHeadline({ repos, activeYears: 17, orgContributions: org }).closing).toBe(
      'De JavaScript a Vue.',
    );
  });

  it('poliglota com ≥6 linguagens', () => {
    const languages = ['Python', 'Python', 'C', 'C++', 'Go', 'Rust', 'Lua'];
    const repos = languages.map((language) => repoIn(2020, { language }));
    expect(headlineOf(repos).closing).toBe('6 linguagens, Python primeiro.');
  });

  it('fiel quando nada mais se aplica', () => {
    const repos = [
      repoIn(2018, { language: 'Python' }),
      repoIn(2019, { language: 'Python' }),
      repoIn(2020, { language: 'Python' }),
    ];
    const headline = headlineOf(repos, 3);
    expect(headline.form).toBe('fiel');
    expect(headline.full).toBe('3 anos. 3 repositórios. Fiel ao Python desde 2018.');
  });

  it('fiel sem linguagem detectada', () => {
    expect(headlineOf([repoIn(2022)], 1).full).toBe('1 ano. 1 repositório. Desde 2022.');
  });
});
