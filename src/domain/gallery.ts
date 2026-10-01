import {
  contributionLevel,
  maxMonth,
  recentMonths,
  type ContributionLevel,
} from './contributions.js';
import { yearOf } from './format.js';
import type { ProfileSnapshot } from './snapshot.js';

/** Minigrade dos cards: 24 colunas × 2 linhas, os últimos 48 meses. */
export const GALLERY_MONTHS = 48;

/** Card da galeria "Perfis para explorar" (§2.1), servido do snapshot. */
export interface GalleryCard {
  username: string;
  name: string;
  avatarUrl: string;
  since: number;
  language: string | null;
  repos: number;
  stars: number;
  levels: ContributionLevel[];
  rank: number;
}

/**
 * Converte um snapshot em card da galeria; `rank` é a posição na aba, a partir de 1.
 * @example galleryCard(snapshot, 1, new Date()).levels.length // 48
 */
export function galleryCard(snapshot: ProfileSnapshot, rank: number, now: Date): GalleryCard {
  const { account, stats, languages, months } = snapshot;
  const max = maxMonth(months);
  return {
    username: account.username,
    name: account.name || account.username,
    avatarUrl: account.avatarUrl,
    since: yearOf(account.createdAt),
    language: languages.find((share) => share.name !== 'Outras')?.name ?? null,
    repos: stats.repos,
    stars: stats.ownStars,
    levels: recentMonths(months, GALLERY_MONTHS, now).map((count) => contributionLevel(count, max)),
    rank,
  };
}

/**
 * Só perfis de pessoas com repositórios públicos entram na galeria (§2.3).
 * @example isGalleryEligible(snapshot) // false para organizações
 */
export function isGalleryEligible(snapshot: ProfileSnapshot): boolean {
  return snapshot.account.type === 'User' && snapshot.stats.repos > 0;
}
