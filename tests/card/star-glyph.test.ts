import { describe, expect, it } from 'vitest';
import { cardLayout } from '../../src/card/card-layout.js';
import type { CardChild, CardNode } from '../../src/card/element.js';
import { STAR_CHAR, starGlyph } from '../../src/card/star-glyph.js';
import { deriveSnapshot } from '../../src/domain/snapshot.js';
import { makeAccount, repoIn } from '../fakes/repo-factory.js';

const starred = deriveSnapshot(
  {
    account: makeAccount({ username: 'famoso' }),
    repos: [repoIn(2018, { name: 'hit', language: 'Go', stars: 5000 })],
    months: {},
    orgContributions: [],
  },
  new Date('2026-09-30T00:00:00Z'),
);

function flatten(child: CardChild): Array<CardNode | string> {
  if (child === null) return [];
  if (typeof child === 'string') return [child];
  const children = child.props.children ?? null;
  const list = Array.isArray(children) ? children : [children];
  return [child, ...list.flatMap(flatten)];
}

describe('starGlyph', () => {
  it('desenha a estrela como svg proporcional ao corpo', () => {
    const glyph = starGlyph('#fff', 60, 15);
    expect(glyph.type).toBe('svg');
    expect(glyph.props.style).toMatchObject({ width: 48, height: 48, marginRight: 15 });
  });

  // Regressão: o ★ virava glifo quebrado no PNG porque o subset latin das fontes não tem U+2605.
  it('manchete com estrela não passa o caractere ★ ao Satori', () => {
    expect(starred.headline.closing).toContain(STAR_CHAR);
    const nodes = flatten(cardLayout(starred, 'escuro', 'headline', { avatarDataUri: null }));
    expect(nodes.filter((item) => typeof item === 'string' && item.includes(STAR_CHAR))).toEqual(
      [],
    );
    expect(nodes.some((item) => typeof item !== 'string' && item.type === 'svg')).toBe(true);
  });
});
