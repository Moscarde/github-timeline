import { describe, expect, it } from 'vitest';
import { deriveSnapshot } from '../../src/domain/snapshot.js';
import { renderRiver } from '../../src/embed/river.js';
import { CAREER_NOW, careerSnapshot } from '../fakes/career-profile.js';
import { makeAccount, repoIn } from '../fakes/repo-factory.js';

const singleYear = () =>
  deriveSnapshot(
    {
      account: makeAccount(),
      repos: [repoIn(2024, { language: 'Go' }), repoIn(2024, { language: 'Rust' })],
      months: {},
      orgContributions: [],
    },
    CAREER_NOW,
  );

describe('renderRiver', () => {
  it('desenha uma faixa por linguagem, com cor do Linguist e tooltip', () => {
    const svg = renderRiver(careerSnapshot(), 'escuro', 'pt-BR');
    expect(svg.match(/<path /g)).toHaveLength(7);
    expect(svg).toContain('fill="#3572A5"');
    expect(svg).toContain('<title>Python — 2021: 0 · 2022: 0 · 2023: 2');
    expect(svg).toContain('>Outras</text>');
  });

  it('anima a revelação da esquerda para a direita e respeita menos movimento', () => {
    const svg = renderRiver(careerSnapshot(), 'escuro', 'pt-BR');
    expect(svg).toContain('@keyframes reveal');
    expect(svg).toContain('clip-path:inset(0 100% 0 0)');
    expect(svg).toContain('prefers-reduced-motion');
  });

  it('traduz rótulos e "Outras"', () => {
    const svg = renderRiver(careerSnapshot(), 'claro', 'en');
    expect(svg).toContain('Language river');
    expect(svg).toContain('>Other</text>');
    expect(svg).toContain('7 repos');
  });

  it('desenha um ano só sem NaN', () => {
    const svg = renderRiver(singleYear(), 'escuro', 'pt-BR');
    expect(svg).not.toContain('NaN');
    expect(svg.match(/<path /g)).toHaveLength(2);
  });

  it('paleta aurora pinta as faixas por posição e mantém "Outras" cinza na faixa e na legenda', () => {
    const svg = renderRiver(careerSnapshot(), 'escuro', 'pt-BR', 'aurora');
    expect(svg).toContain('fill="#2dd4bf" stroke');
    expect(svg).not.toContain('fill="#3572A5"');
    expect(svg.match(/fill="#8b949e"/g)?.length).toBeGreaterThanOrEqual(2);
  });
});
