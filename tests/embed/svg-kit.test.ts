import { describe, expect, it } from 'vitest';
import { renderEmbedNotice } from '../../src/embed/notice.js';
import {
  embedHeader,
  embedPalette,
  round,
  svgDocument,
  svgText,
  wrapWords,
} from '../../src/embed/svg-kit.js';

describe('svg-kit', () => {
  it('quebra por palavras e corta o excesso com reticências', () => {
    expect(wrapWords('Entram Python, Jupyter e data', 16, 2)).toEqual([
      'Entram Python,',
      'Jupyter e data',
    ]);
    expect(wrapWords('um dois tres quatro cinco', 8, 2)).toEqual(['um dois', 'tres…']);
    expect(wrapWords('supercalifragilistico', 8, 1)).toEqual(['superca…']);
  });

  it('escapa o texto e usa fonte mono quando pedido', () => {
    const text = svgText({ x: 1.04, y: 2, size: 10, fill: '#fff', content: '<b>', font: 'mono' });
    expect(text).toContain('&lt;b&gt;');
    expect(text).toContain('x="1"');
    expect(text).toContain('ui-monospace');
  });

  it('monta o documento com título acessível e moldura do tema', () => {
    const svg = svgDocument({
      width: 100,
      height: 50,
      title: 'A & B',
      palette: embedPalette('claro'),
      body: '',
    });
    expect(svg).toContain('aria-label="A &amp; B"');
    expect(svg).toContain('fill="#ffffff" stroke="#d1d9e0"');
  });

  it('separa título e subtítulo com espaço não quebrável', () => {
    const header = embedHeader({
      title: 'T',
      subtitle: 'S',
      right: 'R',
      width: 840,
      palette: embedPalette('escuro'),
    });
    expect(header).toContain('\u00a0·\u00a0S');
  });

  it('arredonda para uma casa', () => {
    expect(round(10.04)).toBe(10);
    expect(round(10.05)).toBe(10.1);
  });

  it('aviso cresce com o texto', () => {
    const short = renderEmbedNotice({ theme: 'escuro', heading: 'h', text: 'curto' });
    const long = renderEmbedNotice({ theme: 'escuro', heading: 'h', text: 'palavra '.repeat(30) });
    expect(short).toContain('height="79"');
    expect(long).toContain('height="130"');
  });
});
