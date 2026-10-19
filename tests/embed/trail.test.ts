import { describe, expect, it } from 'vitest';
import { deriveSnapshot } from '../../src/domain/snapshot.js';
import { renderTrail } from '../../src/embed/trail.js';
import { columnGrouping, squaresFor, trailLayout } from '../../src/embed/trail-layout.js';
import { CAREER_NOW, careerSnapshot } from '../fakes/career-profile.js';
import { makeAccount, repoIn } from '../fakes/repo-factory.js';
import { demoSnapshot } from '../../src/embed/demo-profile.js';

const longCareer = () =>
  deriveSnapshot(
    {
      account: makeAccount(),
      repos: Array.from({ length: 19 }, (_, index) => repoIn(2008 + index)),
      months: {},
      orgContributions: [],
    },
    CAREER_NOW,
  );

describe('geometria da trilha', () => {
  it('usa um mês por coluna até 7 anos e agrupa carreiras longas', () => {
    expect(columnGrouping(6)).toEqual({ monthsPerColumn: 1, pitch: 10 });
    expect(columnGrouping(7)).toEqual({ monthsPerColumn: 1, pitch: 8 });
    expect(columnGrouping(8)).toEqual({ monthsPerColumn: 2, pitch: 14 });
    expect(columnGrouping(19)).toEqual({ monthsPerColumn: 3, pitch: 8 });
  });

  it('escala os quadrados em log relativo ao pico do perfil', () => {
    expect(squaresFor(0, 397)).toBe(0);
    expect(squaresFor(1, 397)).toBe(2);
    expect(squaresFor(397, 397)).toBe(9);
    expect(squaresFor(3, 3)).toBe(9);
  });

  it('marca o pico, o total e os meses depois da coleta', () => {
    const layout = trailLayout(careerSnapshot());
    expect(layout.columns).toHaveLength(72);
    expect(layout.total).toBe(6305);
    expect(layout.peak).toMatchObject({ year: 2025, startMonth: 11, count: 397 });
    expect(layout.columns.filter((column) => column.future).map((c) => c.startMonth)).toEqual([
      10, 11,
    ]);
    expect(layout.showTitles).toBe(true);
  });

  it('cabe 19 anos em 792 px e esconde os títulos das eras', () => {
    const layout = trailLayout(longCareer());
    const last = layout.columns.at(-1);
    expect(layout.columns).toHaveLength(19 * 4);
    expect((last?.x ?? 0) + layout.pitch).toBeLessThanOrEqual(816);
    expect(layout.showTitles).toBe(false);
  });
});

describe('renderTrail', () => {
  it('desenha o SVG animado com totais, eras e pico', () => {
    const svg = renderTrail(careerSnapshot(), 'escuro', 'pt-BR');
    expect(svg).toContain(
      'aria-label="Trilha da carreira de dev: 6.305 contribuições de 2021 a 2026"',
    );
    expect(svg).toContain('@keyframes comet');
    expect(svg).toContain('prefers-reduced-motion');
    expect(svg).toContain('pico · 397 em dez 2025');
    expect(svg).toContain('>2.730</text>');
    expect(svg).toContain('fill="#0d1117"');
  });

  it('usa o tema claro e o idioma pedido', () => {
    const svg = renderTrail(careerSnapshot(), 'claro', 'en');
    expect(svg).toContain('fill="#ffffff"');
    expect(svg).toContain('6,305 contributions · 2021–2026');
    expect(svg).toContain('peak · 397 in Dec 2025');
  });

  it('escapa o username e não deixa NaN na geometria', () => {
    const svg = renderTrail(longCareer(), 'escuro', 'pt-BR');
    expect(svg).not.toContain('NaN');
    expect(svg).not.toContain('<script>');
  });

  it('com anos agrupados, omite o total do ano para não encostar no rótulo', () => {
    const svg = renderTrail(demoSnapshot('x'), 'escuro', 'pt-BR');
    expect(svg).toContain('>2023</text>');
    expect(svg).not.toContain('>2.965</text>');
  });

  it('paleta troca a escala dos quadrados e a cor do cometa', () => {
    const svg = renderTrail(careerSnapshot(), 'claro', 'pt-BR', { palette: 'verde' });
    expect(svg).toContain('fill="#216e39" class="anim"');
    expect(svg).toContain('fill="#1a7f37"');
    expect(svg).not.toContain('#6639ba');
  });

  it('estilo compacto deixa só os anos: sem total, sem descrição e mais baixo', () => {
    const full = renderTrail(careerSnapshot(), 'escuro', 'pt-BR');
    const compact = renderTrail(careerSnapshot(), 'escuro', 'pt-BR', { style: 'compacto' });
    expect(full).toContain('Entram');
    expect(compact).not.toContain('Entram');
    expect(compact).not.toContain('>2.730</text>');
    expect(compact).toContain('>2025</text>');
    const height = (svg: string) => Number(/height="(\d+)"/.exec(svg)?.[1]);
    expect(height(compact)).toBeLessThan(height(full));
  });
});
