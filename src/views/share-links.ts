import { CANONICAL_ORIGIN } from '../config.js';
import type { Theme } from '../lib/theme.js';

export interface ShareLinks {
  page: string;
  card: string;
  x: string;
  linkedin: string;
  badge: string;
  badgeMarkdown: string;
}

/**
 * URLs de compartilhamento no host canônico; seguem o tema ativo (§5.1).
 * @example shareLinks('torvalds', 'escuro', '16 anos. …').x
 */
export function shareLinks(username: string, theme: Theme, headline: string): ShareLinks {
  const path = `/u/${encodeURIComponent(username)}`;
  const page = `${CANONICAL_ORIGIN}${path}?tema=${theme}`;
  const badge = `${CANONICAL_ORIGIN}/badge/${encodeURIComponent(username)}.svg`;
  return {
    page,
    card: `${path}/card.png?tema=${theme}`,
    x: `https://x.com/intent/post?${new URLSearchParams({ text: headline, url: page })}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?${new URLSearchParams({ url: page })}`,
    badge,
    badgeMarkdown: `[![Timeline](${badge})](${CANONICAL_ORIGIN}${path})`,
  };
}
