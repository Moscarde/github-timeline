import { describe, expect, it } from 'vitest';
import { languageStreams, streamTotals } from '../../src/domain/language-streams.js';
import { careerSnapshot } from '../fakes/career-profile.js';

describe('languageStreams', () => {
  it('conta repositórios próprios por linguagem e ano, em ordem de chegada', () => {
    const series = languageStreams(careerSnapshot().timeline, 5);
    expect(series.years).toEqual([2021, 2022, 2023, 2024, 2025, 2026]);
    expect(series.streams.map((stream) => stream.name)).toEqual([
      'HTML',
      'CSS',
      'JavaScript',
      'Python',
      'TypeScript',
      'Outras',
    ]);
    expect(series.streams.find((stream) => stream.name === 'Python')?.values).toEqual([
      0, 0, 2, 3, 6, 1,
    ]);
  });

  it('ignora forks e agrupa o resto em "Outras"', () => {
    const series = languageStreams(careerSnapshot().timeline, 5);
    const names = series.streams.map((stream) => stream.name);
    expect(names).not.toContain('Rust');
    expect(series.streams.at(-1)).toEqual({ name: 'Outras', values: [0, 0, 1, 1, 0, 1] });
  });

  it('soma a largura do rio em cada ano', () => {
    expect(streamTotals(languageStreams(careerSnapshot().timeline))).toEqual([4, 4, 7, 4, 6, 4]);
  });

  it('não cria "Outras" quando todas as linguagens cabem', () => {
    const series = languageStreams(careerSnapshot().timeline, 20);
    expect(series.streams.map((stream) => stream.name)).not.toContain('Outras');
  });
});
