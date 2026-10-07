import type { Locale } from '../i18n/locale.js';
import { message } from '../i18n/translate.js';
import { CANONICAL_ORIGIN } from '../config.js';
import { comparePath } from '../domain/compare.js';
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
export function shareLinks(
  username: string,
  theme: Theme,
  headline: string,
  locale?: Locale,
): ShareLinks {
  const language = locale ? `&lang=${locale}` : '';
  const path = `/u/${encodeURIComponent(username)}`;
  const page = `${CANONICAL_ORIGIN}${path}?tema=${theme}${language}`;
  const badge = `${CANONICAL_ORIGIN}/badge/${encodeURIComponent(username)}.svg${locale ? `?lang=${locale}` : ''}`;
  return {
    page,
    card: `${path}/card.png?tema=${theme}${language}`,
    x: `https://x.com/intent/post?${new URLSearchParams({ text: headline, url: page })}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?${new URLSearchParams({ url: page })}`,
    badge,
    badgeMarkdown: `[![Timeline](${badge})](${CANONICAL_ORIGIN}${path}${locale ? `?lang=${locale}` : ''})`,
  };
}

/** Links da comparação: a página do par, sem card próprio (ainda não existe imagem do par). */
export interface CompareShareLinks {
  page: string;
  x: string;
  linkedin: string;
}

/**
 * URLs de compartilhamento de `/u/<a>...<b>` no host canônico.
 * @example compareShareLinks('torvalds', 'gaearon').page // "https://…/u/torvalds...gaearon"
 */
export function compareShareLinks(a: string, b: string, locale?: Locale): CompareShareLinks {
  const page = `${CANONICAL_ORIGIN}${comparePath(a, b)}${locale ? `?lang=${locale}` : ''}`;
  const text = message('{0} vs {1}: duas trajetórias no GitHub, ano a ano.', locale ?? 'pt-BR', [
    a,
    b,
  ]);
  return {
    page,
    x: `https://x.com/intent/post?${new URLSearchParams({ text, url: page })}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?${new URLSearchParams({ url: page })}`,
  };
}
