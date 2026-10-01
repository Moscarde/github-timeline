import { describe, expect, it } from 'vitest';
import { cardLayout, headlineSize, type CardImages } from '../../src/card/card-layout.js';
import {
  createImageFetcher,
  SatoriCardRenderer,
  type ImageFetcher,
} from '../../src/card/card-renderer.js';
import type { CardNode } from '../../src/card/element.js';
import { loadCardFonts } from '../../src/card/fonts.js';
import { deriveSnapshot } from '../../src/domain/snapshot.js';
import { makeAccount, repoIn } from '../fakes/repo-factory.js';
import { FakeFetch } from '../fakes/fake-fetch.js';

const snapshot = deriveSnapshot(
  {
    account: makeAccount({ username: 'dev', name: 'Dev' }),
    repos: [repoIn(2016, { language: 'Go' }), repoIn(2024, { language: 'Rust' })],
    months: Object.fromEntries(
      Array.from({ length: 11 }, (_, i) => [2016 + i, Array<number>(12).fill(i)]),
    ),
    orgContributions: [],
  },
  new Date('2026-09-30T00:00:00Z'),
);
const images: CardImages = { avatarDataUri: null };

function texts(node: CardNode | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  const children = node.props.children;
  return (Array.isArray(children) ? children : [children]).flatMap((child) => texts(child ?? null));
}

describe('cardLayout', () => {
  it('mostra manchete curta palavra a palavra, 8 anos de grade e domínio', () => {
    const all = texts(cardLayout(snapshot, 'escuro', 'headline', images));
    expect(all.join(' ')).toContain(snapshot.headline.short);
    expect(all.filter((text) => /^20\d\d$/.test(text))).toEqual([
      '2019',
      '2020',
      '2021',
      '2022',
      '2023',
      '2024',
      '2025',
      '2026',
    ]);
    expect(all).toContain('github-timeline.frangolab.com');
  });

  it('variante número destaca a contagem de repositórios', () => {
    expect(texts(cardLayout(snapshot, 'claro', 'numero', images))).toContain(
      'repositórios em 9 anos',
    );
  });

  it('reduz o corpo da manchete em frases longas', () => {
    expect(headlineSize('8 anos de código. De HTML a React.')).toBe(76);
    expect(headlineSize('16 anos de código. 11 linguagens, Python primeiro.')).toBe(60);
    expect(headlineSize('x'.repeat(60))).toBe(48);
  });
});

describe('SatoriCardRenderer', () => {
  it('gera PNG 1200×630 e reaproveita o cache', async () => {
    let fetches = 0;
    const fetchImage: ImageFetcher = async () => {
      fetches += 1;
      return null;
    };
    const renderer = new SatoriCardRenderer({
      fonts: await loadCardFonts(),
      fetchImage,
    });
    const png = await renderer.render(snapshot, 'escuro', 'headline');
    const view = new DataView(png.buffer);
    expect([...png.slice(1, 4)].map((byte) => String.fromCharCode(byte)).join('')).toBe('PNG');
    expect([view.getUint32(16), view.getUint32(20)]).toEqual([1200, 630]);
    await renderer.render(snapshot, 'escuro', 'headline');
    expect(fetches).toBe(1);
  }, 15_000);
});

describe('createImageFetcher', () => {
  it('converte em data URI e devolve null em falha', async () => {
    const fake = new FakeFetch()
      .enqueue(new Response(new Uint8Array([1, 2]), { headers: { 'content-type': 'image/png' } }))
      .enqueue(new Response('x', { status: 404 }));
    const fetchImage = createImageFetcher(fake.fetch as typeof fetch, 1000);
    expect(await fetchImage('https://a/1')).toBe('data:image/png;base64,AQI=');
    expect(await fetchImage('https://a/2')).toBeNull();
  });
});
