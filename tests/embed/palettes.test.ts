import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RIVER_PALETTE,
  DEFAULT_TRAIL_PALETTE,
  parseRiverPalette,
  parseTrailPalette,
  riverColors,
  riverPaletteOptions,
  trailPaletteOptions,
  trailScale,
} from '../../src/embed/palettes.js';

describe('paletas', () => {
  it('lê ?paleta= e cai no padrão com valor desconhecido ou ausente', () => {
    expect(parseTrailPalette('verde')).toBe('verde');
    expect(parseTrailPalette('aurora')).toBe(DEFAULT_TRAIL_PALETTE);
    expect(parseTrailPalette(undefined)).toBe('roxo');
    expect(parseRiverPalette('por-do-sol')).toBe('por-do-sol');
    expect(parseRiverPalette('verde')).toBe(DEFAULT_RIVER_PALETTE);
  });

  it('cada paleta da trilha tem escala de 5 níveis nos dois temas, começando no vazio', () => {
    for (const { id } of trailPaletteOptions()) {
      const escuro = trailScale(parseTrailPalette(id), 'escuro');
      const claro = trailScale(parseTrailPalette(id), 'claro');
      expect(escuro.levels).toHaveLength(5);
      expect(escuro.levels[0]).toBe('#161b22');
      expect(claro.levels[0]).toBe('#ebedf0');
    }
  });

  it('verde reproduz o gráfico de contribuições do GitHub', () => {
    expect(trailScale('verde', 'claro').levels).toEqual([
      '#ebedf0',
      '#9be9a8',
      '#40c463',
      '#30a14e',
      '#216e39',
    ]);
  });

  it('o rio usa as cores do Linguist por padrão e cores por posição nas outras', () => {
    expect(riverColors('linguagens')).toBeNull();
    expect(riverColors('aurora')).toHaveLength(6);
  });

  it('opções do seletor trazem a padrão primeiro, com rótulo', () => {
    expect(trailPaletteOptions()[0]).toEqual({ id: 'roxo', label: 'Roxo' });
    expect(riverPaletteOptions().map((option) => option.id)).toEqual([
      'linguagens',
      'aurora',
      'por-do-sol',
    ]);
  });
});
