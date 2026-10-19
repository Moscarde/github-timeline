import { describe, expect, it } from 'vitest';
import {
  fillTemplate,
  parseUsername,
  selectionSegment,
  toggleAchievement,
} from '../../public/assets/readme-builder-core.js';

const ALL = ['primeiro-repo', 'estrelado', 'poliglota', 'topics-50'];

describe('parseUsername', () => {
  it('aceita username, @username e a URL do perfil', () => {
    expect(parseUsername(' octocat ')).toEqual({ status: 'ok', username: 'octocat' });
    expect(parseUsername('@octocat')).toEqual({ status: 'ok', username: 'octocat' });
    expect(parseUsername('https://github.com/octocat/')).toEqual({
      status: 'ok',
      username: 'octocat',
    });
  });

  it('separa campo vazio de username inválido, guardando o que chegou', () => {
    expect(parseUsername('   ')).toEqual({ status: 'empty' });
    expect(parseUsername('-x-')).toEqual({ status: 'invalid', received: '-x-' });
    expect(parseUsername('a'.repeat(40))).toMatchObject({ status: 'invalid' });
  });
});

describe('selectionSegment', () => {
  it('todas ligadas usam o endereço curto', () => {
    expect(selectionSegment([...ALL].reverse(), ALL)).toBeNull();
  });

  it('segue a ordem do catálogo, não a ordem dos cliques', () => {
    expect(selectionSegment(['topics-50', 'estrelado'], ALL)).toBe('estrelado,topics-50');
  });
});

describe('fillTemplate', () => {
  const values = { placeholder: 'seu-usuario', username: null, selection: null };

  it('troca o placeholder pelo usuário em todas as ocorrências', () => {
    const template = '[![T](https://x/embed/seu-usuario/trilha.svg)](https://x/u/seu-usuario)';
    expect(fillTemplate(template, { ...values, username: 'ana' })).toBe(
      '[![T](https://x/embed/ana/trilha.svg)](https://x/u/ana)',
    );
  });

  it('sem usuário mantém o placeholder', () => {
    expect(fillTemplate('/embed/seu-usuario/x.svg', values)).toBe('/embed/seu-usuario/x.svg');
  });

  it('aplica a seleção de conquistas no endereço do embed e do exemplo', () => {
    const selection = 'poliglota,topics-50';
    expect(
      fillTemplate('/embed/seu-usuario/conquistas.svg?lang=en', {
        ...values,
        username: 'ana',
        selection,
      }),
    ).toBe('/embed/ana/conquistas/poliglota,topics-50.svg?lang=en');
    expect(fillTemplate('/exemplos/conquistas.svg?tema=claro', { ...values, selection })).toBe(
      '/exemplos/conquistas/poliglota,topics-50.svg?tema=claro',
    );
  });

  it('seleção não afeta os outros embeds', () => {
    expect(fillTemplate('/exemplos/trilha.svg', { ...values, selection: 'poliglota' })).toBe(
      '/exemplos/trilha.svg',
    );
  });
});

describe('toggleAchievement', () => {
  it('liga e desliga', () => {
    expect(toggleAchievement(['a', 'b'], 'a')).toEqual(['b']);
    expect(toggleAchievement(['b'], 'a')).toEqual(['b', 'a']);
  });

  it('não deixa a seleção vazia', () => {
    expect(toggleAchievement(['a'], 'a')).toEqual(['a']);
  });
});

describe('fillTemplate com ajustes da URL', () => {
  const values = { placeholder: 'seu-usuario', username: 'ana', selection: null };

  it('insere ?paleta= logo após .svg, mantendo os outros parâmetros', () => {
    expect(
      fillTemplate(
        '[![T](https://x/embed/seu-usuario/trilha.svg?lang=pt-BR)](https://x/u/seu-usuario?lang=pt-BR)',
        { ...values, params: { paleta: 'verde' } },
      ),
    ).toBe(
      '[![T](https://x/embed/ana/trilha.svg?paleta=verde&lang=pt-BR)](https://x/u/ana?lang=pt-BR)',
    );
  });

  it('sem ajustes fora do padrão o endereço não muda', () => {
    expect(
      fillTemplate('/exemplos/linguagens.svg?lang=en&tema=claro', { ...values, params: {} }),
    ).toBe('/exemplos/linguagens.svg?lang=en&tema=claro');
  });
});

describe('fillTemplate com vários ajustes', () => {
  it('insere todos na ordem recebida', () => {
    const values = { placeholder: 'seu-usuario', username: 'ana', selection: null };
    expect(
      fillTemplate('/embed/seu-usuario/trilha.svg?lang=en', {
        ...values,
        params: { paleta: 'azul', estilo: 'compacto' },
      }),
    ).toBe('/embed/ana/trilha.svg?paleta=azul&estilo=compacto&lang=en');
  });
});
