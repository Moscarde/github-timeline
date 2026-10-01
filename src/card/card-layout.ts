import { BRAND } from '../brand/symbol.js';
import { formatCompact, formatInteger, formatPercent } from '../domain/format.js';
import { languageColor } from '../domain/language-colors.js';
import type { ProfileSnapshot } from '../domain/snapshot.js';
import type { Theme } from '../lib/theme.js';
import { node, type CardNode } from './element.js';

export type CardVariant = 'headline' | 'numero';

export interface CardImages {
  avatarDataUri: string | null;
  logoDataUri: string;
}

interface CardPalette {
  background: string;
  text: string;
  muted: string;
  panel: string;
  levels: [string, string, string, string, string];
}

const PALETTES: Record<Theme, CardPalette> = {
  escuro: {
    background: BRAND.navy,
    text: BRAND.light,
    muted: '#94A3B8',
    panel: '#1E293B',
    levels: ['#1E293B', '#14532D', '#15803D', '#16A34A', BRAND.green],
  },
  claro: {
    background: BRAND.light,
    text: BRAND.navy,
    muted: BRAND.slate,
    panel: BRAND.line,
    levels: [BRAND.line, '#BBF7D0', '#4ADE80', BRAND.green, BRAND.greenText],
  },
};

const GRID_YEARS = 8;
export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

/**
 * Árvore do card 1200×630 (§5.1).
 * @example cardLayout(snapshot, 'escuro', 'headline', images)
 */
export function cardLayout(
  snapshot: ProfileSnapshot,
  theme: Theme,
  variant: CardVariant,
  images: CardImages,
): CardNode {
  const palette = PALETTES[theme];
  const root = {
    display: 'flex',
    flexDirection: 'column',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    padding: 56,
    background: palette.background,
    color: palette.text,
    fontFamily: 'Mona Sans',
  };
  return node('div', root, [
    identity(snapshot, palette, images),
    node('div', { display: 'flex', flex: 1, marginTop: 36, gap: 48 }, [
      node('div', { display: 'flex', flexDirection: 'column', flex: 1 }, [
        message(snapshot, variant, palette),
        indicators(snapshot, palette),
      ]),
      node('div', { display: 'flex', flexDirection: 'column', width: 380 }, [
        monthGrid(snapshot, palette),
        topLanguages(snapshot, palette),
      ]),
    ]),
    footer(palette, images),
  ]);
}

function identity(snapshot: ProfileSnapshot, palette: CardPalette, images: CardImages): CardNode {
  const { account } = snapshot;
  const avatar = images.avatarDataUri
    ? node('img', { width: 96, height: 96, borderRadius: 48 }, null, {
        src: images.avatarDataUri,
        width: 96,
        height: 96,
      })
    : node('div', { width: 96, height: 96, borderRadius: 48, background: palette.panel }, null);
  return node('div', { display: 'flex', alignItems: 'center', gap: 24 }, [
    avatar,
    node('div', { display: 'flex', flexDirection: 'column' }, [
      node('div', { fontSize: 44, fontWeight: 700 }, account.name || account.login),
      node(
        'div',
        { fontSize: 26, color: palette.muted, fontFamily: 'JetBrains Mono' },
        `@${account.login}`,
      ),
    ]),
  ]);
}

function message(snapshot: ProfileSnapshot, variant: CardVariant, palette: CardPalette): CardNode {
  if (variant === 'numero') {
    return node('div', { display: 'flex', flexDirection: 'column' }, [
      node(
        'div',
        { fontSize: 120, fontWeight: 700, color: BRAND.green, lineHeight: 1 },
        formatInteger(snapshot.stats.repos),
      ),
      node('div', { fontSize: 34, color: palette.muted }, 'repositórios públicos'),
    ]);
  }
  return node('div', { fontSize: 46, fontWeight: 700, lineHeight: 1.2 }, snapshot.headline.short);
}

function indicators(snapshot: ProfileSnapshot, palette: CardPalette): CardNode {
  const { stats } = snapshot;
  const items: Array<[string, string]> = [
    [formatInteger(stats.activeYears), 'anos'],
    [formatInteger(stats.repos), 'repositórios'],
    [formatCompact(stats.ownStars), 'stars'],
  ];
  return node(
    'div',
    { display: 'flex', gap: 40, marginTop: 'auto' },
    items.map(([value, label]) =>
      node('div', { display: 'flex', flexDirection: 'column' }, [
        node('div', { fontSize: 40, fontWeight: 700, fontFamily: 'JetBrains Mono' }, value),
        node('div', { fontSize: 22, color: palette.muted }, label),
      ]),
    ),
  );
}

function monthGrid(snapshot: ProfileSnapshot, palette: CardPalette): CardNode {
  const years = Object.keys(snapshot.months)
    .map(Number)
    .sort((a, b) => a - b)
    .slice(-GRID_YEARS);
  const max = Math.max(1, ...years.flatMap((year) => snapshot.months[year] ?? []));
  return node(
    'div',
    { display: 'flex', flexDirection: 'column', gap: 6 },
    years.map((year) =>
      node('div', { display: 'flex', alignItems: 'center', gap: 6 }, [
        node(
          'div',
          { width: 64, fontSize: 18, color: palette.muted, fontFamily: 'JetBrains Mono' },
          String(year),
        ),
        ...(snapshot.months[year] ?? []).map((count) =>
          node(
            'div',
            {
              width: 20,
              height: 20,
              borderRadius: 4,
              background: palette.levels[gridLevel(count, max)],
            },
            null,
          ),
        ),
      ]),
    ),
  );
}

function gridLevel(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((count / max) * 4))) as 1 | 2 | 3 | 4;
}

function topLanguages(snapshot: ProfileSnapshot, palette: CardPalette): CardNode {
  const top = snapshot.languages.filter((share) => share.name !== 'Outras').slice(0, 3);
  return node(
    'div',
    { display: 'flex', flexWrap: 'wrap', columnGap: 20, rowGap: 8, marginTop: 24, fontSize: 22 },
    top.map((share) =>
      node('div', { display: 'flex', alignItems: 'center', gap: 8 }, [
        node(
          'div',
          { width: 14, height: 14, borderRadius: 7, background: languageColor(share.name) },
          null,
        ),
        node(
          'div',
          { display: 'flex', color: palette.text },
          `${share.name} ${formatPercent(share.ratio)}`,
        ),
      ]),
    ),
  );
}

function footer(palette: CardPalette, images: CardImages): CardNode {
  return node(
    'div',
    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 28 },
    [
      node('img', { height: 40 }, null, { src: images.logoDataUri, width: 163, height: 40 }),
      node(
        'div',
        { fontSize: 22, color: palette.muted, fontFamily: 'JetBrains Mono' },
        'github-timeline.frangolab.com',
      ),
    ],
  );
}
