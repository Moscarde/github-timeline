import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import type { ProfileSnapshot } from '../domain/snapshot.js';
import type { Theme } from '../lib/theme.js';
import { avatarUrl } from '../lib/avatar.js';
import { CARD_HEIGHT, CARD_WIDTH, cardLayout, type CardVariant } from './card-layout.js';
import type { CardFont } from './fonts.js';

/** Busca uma imagem remota como data URI; `null` se falhar (o card sai sem avatar). */
export type ImageFetcher = (url: string) => Promise<string | null>;

/** Gera o PNG do card (§5.1). */
export interface CardRenderer {
  render(
    snapshot: ProfileSnapshot,
    theme: Theme,
    variant: CardVariant,
  ): Promise<Uint8Array<ArrayBuffer>>;
}

export interface SatoriCardRendererDeps {
  fonts: CardFont[];
  fetchImage: ImageFetcher;
  cacheSize?: number;
}

/**
 * Satori (JSX/flexbox → SVG) + resvg (SVG → PNG), com cache por username, tema, variante e
 * versão do snapshot.
 * @example await renderer.render(snapshot, 'escuro', 'headline')
 */
export class SatoriCardRenderer implements CardRenderer {
  private readonly cache = new Map<string, Uint8Array<ArrayBuffer>>();

  constructor(private readonly deps: SatoriCardRendererDeps) {}

  async render(
    snapshot: ProfileSnapshot,
    theme: Theme,
    variant: CardVariant,
  ): Promise<Uint8Array<ArrayBuffer>> {
    const key = [
      snapshot.account.username.toLowerCase(),
      theme,
      variant,
      snapshot.version,
      snapshot.generatedAt,
    ].join('|');
    const cached = this.cache.get(key);
    if (cached) return cached;
    const png = await this.draw(snapshot, theme, variant);
    this.remember(key, png);
    return png;
  }

  private async draw(
    snapshot: ProfileSnapshot,
    theme: Theme,
    variant: CardVariant,
  ): Promise<Uint8Array<ArrayBuffer>> {
    const avatarDataUri = await this.deps.fetchImage(avatarUrl(snapshot.account.avatarUrl, 192));
    const tree = cardLayout(snapshot, theme, variant, { avatarDataUri });
    // O Satori tipa a entrada como ReactNode; a árvore tem o mesmo shape sem depender de React.
    const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      fonts: this.deps.fonts,
    });
    return new Uint8Array(
      new Resvg(svg, { fitTo: { mode: 'width', value: CARD_WIDTH } }).render().asPng(),
    );
  }

  /** Cache LRU simples: o Map preserva a ordem de inserção. */
  private remember(key: string, png: Uint8Array<ArrayBuffer>): void {
    this.cache.set(key, png);
    const limit = this.deps.cacheSize ?? 200;
    const oldest = this.cache.keys().next().value;
    if (this.cache.size > limit && oldest !== undefined) this.cache.delete(oldest);
  }
}

/**
 * Busca imagens com `fetch` injetado e tempo limite; falha vira `null`.
 * @example const fetchImage = createImageFetcher(fetch, 3000);
 */
export function createImageFetcher(fetchFn: typeof fetch, timeoutMs: number): ImageFetcher {
  return async (url) => {
    try {
      const response = await fetchFn(url, { signal: AbortSignal.timeout(timeoutMs) });
      if (!response.ok) return null;
      const type = response.headers.get('content-type') ?? 'image/png';
      return `data:${type};base64,${Buffer.from(await response.arrayBuffer()).toString('base64')}`;
    } catch {
      return null;
    }
  };
}
