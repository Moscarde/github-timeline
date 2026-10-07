import type { Achievement } from '../domain/achievements.js';
import type { Headline } from '../domain/headline.js';
import type { ProfileSnapshot } from '../domain/snapshot.js';
import type { Locale } from './locale.js';
import { translateStored } from './stored.js';

/** Localize presentation copies without mutating shared snapshots. @example localizeSnapshot(snapshot, 'en') */
export function localizeSnapshot(snapshot: ProfileSnapshot, locale: Locale): ProfileSnapshot {
  if (locale === 'pt-BR') return snapshot;
  return {
    ...snapshot,
    headline: localizeHeadline(snapshot.headline, locale),
    achievements: snapshot.achievements.map((achievement) =>
      localizeAchievement(achievement, locale),
    ),
    timeline: snapshot.timeline.map((era) => ({
      ...era,
      title: translateStored(era.title, locale),
    })),
  };
}

function localizeHeadline(headline: Headline, locale: Locale): Headline {
  const opening = translateStored(headline.opening, locale);
  const shortOpening = translateStored(headline.shortOpening, locale);
  const closing = translateStored(headline.closing, locale);
  return {
    ...headline,
    opening,
    shortOpening,
    closing,
    full: `${opening} ${closing}`,
    short: `${shortOpening} ${closing}`,
  };
}

function localizeAchievement(achievement: Achievement, locale: Locale): Achievement {
  const repoName = achievement.unlocked && ['stars-100', 'stars-1000'].includes(achievement.id);
  return {
    ...achievement,
    title: translateStored(achievement.title, locale),
    detail: repoName ? achievement.detail : translateStored(achievement.detail, locale),
    mark: achievement.id === 'uma-decada' ? '10y' : achievement.mark,
  };
}
