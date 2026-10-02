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
