import { describe, expect, it } from 'vitest';
import { eraLead } from '../../src/views/era-text.js';

describe('eraLead', () => {
  it('monta o parágrafo do ano', () => {
    const parts = eraLead({
      repoCount: 3,
      forkCount: 1,
      topLanguage: { name: 'Go', count: 2, of: 2 },
      topTopics: ['cli', 'api'],
      mostStarred: { name: 'tool', stars: 1200 },
      contributions: 1,
    });
    expect(parts.map((part) => part.text).join('')).toBe(
      '3 repositórios criados (1 fork). Linguagem predominante: Go (2 de 2). Topics mais usados: cli, api. Mais estrelado: tool (★ 1.200). 1 contribuição pública no ano.',
    );
    expect(parts.filter((part) => part.strong).map((part) => part.text)).toEqual(['Go', 'tool']);
  });

  it('fica vazio para ano sem dados', () => {
    expect(
      eraLead({
        repoCount: 0,
        forkCount: 0,
        topLanguage: null,
        topTopics: [],
        mostStarred: null,
        contributions: null,
      }),
    ).toEqual([]);
  });
});
