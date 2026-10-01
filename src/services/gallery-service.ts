import { galleryCard, isGalleryEligible, type GalleryCard } from '../domain/gallery.js';
import type { ProfileSnapshot } from '../domain/snapshot.js';
import { mapWithConcurrency } from '../lib/concurrency.js';
import type { Logger } from '../lib/logger.js';

export type GalleryTabId = 'em-alta' | 'lendas' | 'brasil' | 'criadores';

/** Listas editoriais de `data/curated.json`: só usernames, na ordem de exibição (§2.3). */
export type CuratedLists = Record<Exclude<GalleryTabId, 'em-alta'>, string[]>;

export interface GalleryTab {
  id: GalleryTabId;
  label: string;
  cards: GalleryCard[];
}

/** O que a galeria precisa do serviço de perfis. */
export interface GallerySnapshots {
  findStored(username: string): ProfileSnapshot | null;
  getProfile(username: string): Promise<unknown>;
}

export interface GalleryServiceDeps {
  profiles: GallerySnapshots;
  trending: (limit: number) => string[];
  curated: CuratedLists;
  logger: Logger;
  now: () => Date;
}

const CARDS_PER_TAB = 6;
const WARM_CONCURRENCY = 2;
const LABELS: Record<GalleryTabId, string> = {
  'em-alta': 'Em alta',
  lendas: 'Lendas',
  brasil: 'Brasil',
  criadores: 'Criadores de linguagem',
};

/**
 * Abas da galeria montadas de snapshots, sem consultar o GitHub a cada visita (§2.1).
 * @example gallery.tabs()[0].cards
 */
export class GalleryService {
  private warmed = false;

  constructor(private readonly deps: GalleryServiceDeps) {}

  tabs(): GalleryTab[] {
    const trending = this.deps.trending(CARDS_PER_TAB * 3);
    return (Object.keys(LABELS) as GalleryTabId[]).map((id) => ({
      id,
      label: LABELS[id],
      cards: this.cardsFor(id === 'em-alta' ? trending : this.deps.curated[id]),
    }));
  }

  /**
   * Coleta, uma vez por processo, os perfis curados sem snapshot. Falhas só são registradas:
   * o card some da aba até a próxima tentativa.
   */
  warmCurated(): void {
    if (this.warmed) return;
    this.warmed = true;
    const missing = [...new Set(Object.values(this.deps.curated).flat())].filter(
      (username) => !this.deps.profiles.findStored(username),
    );
    void mapWithConcurrency(missing, WARM_CONCURRENCY, (username) => this.warm(username));
  }

  private async warm(username: string): Promise<void> {
    try {
      await this.deps.profiles.getProfile(username);
    } catch (error) {
      this.deps.logger.log('warn', 'gallery.warm_failed', { username, error: String(error) });
    }
  }

  private cardsFor(usernames: string[]): GalleryCard[] {
    const snapshots = usernames
      .map((username) => this.deps.profiles.findStored(username))
      .filter((snapshot): snapshot is ProfileSnapshot => !!snapshot && isGalleryEligible(snapshot));
    return snapshots
      .slice(0, CARDS_PER_TAB)
      .map((snapshot, index) => galleryCard(snapshot, index + 1, this.deps.now()));
  }
}
