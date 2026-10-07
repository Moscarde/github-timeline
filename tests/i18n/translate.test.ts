import { clientMessages } from '../../src/i18n/client.js';
import { describe, expect, it } from 'vitest';
import { ENGLISH } from '../../src/i18n/messages.js';
import { message, translate } from '../../src/i18n/translate.js';
import { STORED_MESSAGES, storedNumber, translateStored } from '../../src/i18n/stored.js';

describe('application messages', () => {
  it('keeps every interpolation slot in the translation catalog', () => {
    for (const [source, english] of Object.entries(ENGLISH)) {
      expect(english.trim()).not.toBe('');
      expect(english.match(/\{\d+\}/g)?.sort() ?? []).toEqual(
        source.match(/\{\d+\}/g)?.sort() ?? [],
      );
    }
    expect(translate('Gerar timeline →', 'en')).toBe('Create timeline →');
    expect(translate('Copiar', 'pt-BR')).toBe('Copiar');
  });

  it('preserves spaces and unknown messages', () => {
    expect(translate(' Copiar ', 'en')).toBe(' Copy ');
    expect(translate('Unrecognized text', 'en')).toBe('Unrecognized text');
  });

  it('interpolates after translating and preserves user content', () => {
    expect(message('no GitHub desde {0}', 'en', ['<repo>{1} desde'])).toBe(
      'on GitHub since <repo>{1} desde',
    );
    expect(message('às {0}', 'pt-BR', ['12:00'])).toBe('às 12:00');
    expect(message('às {0}', 'en', [])).toBe('at ');
  });
});

describe('existing Portuguese snapshots', () => {
  it.each(STORED_MESSAGES)('adapts %s without changing dynamic names', (source, english) => {
    const portuguese = source.replace(/\{([nsl])\d+\}/g, (_, type: string) =>
      type === 'n' ? '1.234' : type === 'l' ? 'Go e Rust' : 'name <&>',
    );
    const expected = english.replace(/\{([nsl])\d+\}/g, (_, type: string) =>
      type === 'n' ? '1,234' : type === 'l' ? 'Go and Rust' : 'name <&>',
    );
    expect(translateStored(portuguese, 'en')).toBe(expected);
    expect(translateStored(portuguese, 'pt-BR')).toBe(portuguese);
  });

  it.each([
    ['1.234', '1,234'],
    ['1,4k', '1.4k'],
    ['250,7k', '250.7k'],
    ['1,2 mi', '1.2m'],
    ['123', '123'],
  ])('converts stored number %s', (source, english) => {
    expect(storedNumber(source)).toBe(english);
  });

  it('translates dates, static labels and leaves unknown strings untouched', () => {
    expect(translateStored('fev 2024', 'en')).toBe('Feb 2024');
    expect(translateStored('zzz 2024', 'en')).toBe('zzz 2024');
    expect(translateStored('Uma década', 'en')).toBe('A decade');
    expect(translateStored('unknown repository description', 'en')).toBe(
      'unknown repository description',
    );
  });
});

describe('shared client catalog', () => {
  it('provides localized feedback for both languages', () => {
    expect(clientMessages('en')).toEqual({
      'Copiado ✓': 'Copied ✓',
      'Selecione e copie': 'Select and copy',
      'Mostrar menos': 'Show less',
      'A coleta não terminou. Recarregue a página para tentar de novo.':
        'Collection did not finish. Reload the page to try again.',
    });
    expect(clientMessages('pt-BR')['Copiado ✓']).toBe('Copiado ✓');
  });
});
