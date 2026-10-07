import { describe, expect, it } from 'vitest';
import { compareShareLinks, shareLinks } from '../../src/views/share-links.js';

describe('shareLinks', () => {
  it('usa o host canônico e o tema ativo', () => {
    const links = shareLinks('dev', 'claro', '6 anos. 2 repositórios.');
    expect(links.page).toBe('https://github-timeline.frangolab.com/u/dev?tema=claro');
    expect(links.card).toBe('/u/dev/card.png?tema=claro');
    expect(new URL(links.x).searchParams.get('url')).toBe(links.page);
    expect(new URL(links.linkedin).searchParams.get('url')).toBe(links.page);
    expect(links.badgeMarkdown).toBe(
      '[![Timeline](https://github-timeline.frangolab.com/badge/dev.svg)](https://github-timeline.frangolab.com/u/dev)',
    );
  });
});

describe('compareShareLinks', () => {
  it('compartilha a página do par, não a de um dos perfis', () => {
    const links = compareShareLinks('ana', 'bia');
    expect(links.page).toBe('https://github-timeline.frangolab.com/u/ana...bia');
    expect(new URL(links.x).searchParams.get('url')).toBe(links.page);
    expect(new URL(links.x).searchParams.get('text')).toContain('ana vs bia');
    expect(new URL(links.linkedin).searchParams.get('url')).toBe(links.page);
  });
});

describe('localized share links', () => {
  it('keeps the chosen language in page, card, social and badge links', () => {
    const links = shareLinks('dev', 'claro', '6 years. 2 repositories.', 'en');
    expect(links.page).toBe('https://github-timeline.frangolab.com/u/dev?tema=claro&lang=en');
    expect(links.card).toBe('/u/dev/card.png?tema=claro&lang=en');
    expect(new URL(links.x).searchParams.get('text')).toBe('6 years. 2 repositories.');
    expect(new URL(links.x).searchParams.get('url')).toBe(links.page);
    expect(links.badgeMarkdown).toContain('/badge/dev.svg?lang=en');
    expect(links.badgeMarkdown).toContain('/u/dev?lang=en');
  });

  it('shares the comparison in English and Portuguese', () => {
    const english = compareShareLinks('ana', 'bia', 'en');
    expect(new URL(english.x).searchParams.get('text')).toBe(
      'ana vs bia: two GitHub journeys, year by year.',
    );
    expect(english.page).toContain('?lang=en');
    const portuguese = compareShareLinks('ana', 'bia', 'pt-BR');
    expect(new URL(portuguese.x).searchParams.get('text')).toContain('duas trajetórias');
    expect(portuguese.page).toContain('?lang=pt-BR');
  });
});
