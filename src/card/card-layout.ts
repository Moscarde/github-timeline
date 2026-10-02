import { CANONICAL_HOST } from '../config.js';
import { contributionLevel, maxMonth } from '../domain/contributions.js';
import { formatCompact, formatInteger, plural } from '../domain/format.js';
import { languageColor } from '../domain/language-colors.js';
import type { ProfileSnapshot } from '../domain/snapshot.js';
import type { Theme } from '../lib/theme.js';
import { node, type CardNode } from './element.js';
import { STAR_CHAR, starGlyph } from './star-glyph.js';

export type CardVariant = 'headline' | 'numero';

export interface CardImages {
  avatarDataUri: string | null;
}

interface CardPalette {
  canvas: string;
  /** Brilho no canto inferior direito; o Satori não entende `color-mix`. */
  glow: string;
  /** Fim do degradê: a mesma cor com alfa 0; `transparent` puxaria para cinza no resvg. */
  glowEnd: string;
  fg: string;
  muted: string;
  brand: string;
  ink: string;
  subtle: string;
  levels: [string, string, string, string, string];
}

/** Mesmos tokens das páginas (base.css): o card segue o tema ativo (§5.1). */
const PALETTES: Record<Theme, CardPalette> = {
  escuro: {
    canvas: '#0d1117',
    glow: 'rgba(14, 68, 41, 0.45)',
    glowEnd: 'rgba(14, 68, 41, 0)',
    fg: '#e6edf3',
    muted: '#9198a1',
    brand: '#39d353',
    ink: '#39d353',
    subtle: '#161b22',
    levels: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
  },
  claro: {
    canvas: '#ffffff',
    glow: 'rgba(172, 238, 187, 0.45)',
    glowEnd: 'rgba(172, 238, 187, 0)',
    fg: '#1f2328',
    muted: '#59636e',
    brand: '#2da44e',
    ink: '#1a7f37',
    subtle: '#f6f8fa',
    levels: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
  },
};

const GRID_YEARS = 8;
const GRID_COLUMN = 440;
const CELL = 27;
export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

/**
 * Árvore do card 1200×630 (§5.1, tela 03 do template).
 * @example cardLayout(snapshot, 'escuro', 'headline', { avatarDataUri: null })
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
    position: 'relative',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    padding: '56px 60px',
    gap: 48,
    backgroundColor: palette.canvas,
    backgroundImage: `radial-gradient(ellipse at 100% 100%, ${palette.glow}, ${palette.glowEnd} 60%)`,
    color: palette.fg,
    fontFamily: 'Mona Sans',
  };
  return node('div', root, [
    node('div', { display: 'flex', flexDirection: 'column', flex: 1 }, [
      identity(snapshot, palette, images),
      message(snapshot, variant, palette),
      node('div', { display: 'flex', flex: 1 }, null),
      indicators(snapshot, palette),
    ]),
    node('div', gridColumnStyle(), [monthGrid(snapshot, palette), topLanguages(snapshot)]),
    siteTag(palette),
  ]);
}

function gridColumnStyle(): Record<string, string | number> {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    width: GRID_COLUMN,
    justifyContent: 'center',
  };
}

function identity(snapshot: ProfileSnapshot, palette: CardPalette, images: CardImages): CardNode {
  const { account } = snapshot;
  const frame = { width: 64, height: 64, borderRadius: 32, border: `2px solid ${palette.brand}` };
  const avatar = images.avatarDataUri
    ? node('img', frame, null, { src: images.avatarDataUri, width: 64, height: 64 })
    : node('div', { ...frame, background: palette.subtle }, null);
  return node('div', { display: 'flex', alignItems: 'center', gap: 16 }, [
    avatar,
    node('div', { display: 'flex', flexDirection: 'column' }, [
      node('div', { fontSize: 24, fontWeight: 700 }, account.name || account.username),
      node(
        'div',
        { fontSize: 16, color: palette.muted, fontFamily: 'JetBrains Mono' },
        `@${account.username}`,
      ),
    ]),
  ]);
}

function message(snapshot: ProfileSnapshot, variant: CardVariant, palette: CardPalette): CardNode {
  if (variant === 'numero') return bigNumber(snapshot, palette);
  const { shortOpening, closing } = snapshot.headline;
  const size = headlineSize(`${shortOpening} ${closing}`);
  return node(
    'div',
    {
      display: 'flex',
      flexWrap: 'wrap',
      marginTop: 44,
      fontSize: size,
      lineHeight: 0.98,
      fontWeight: 800,
      letterSpacing: '-0.035em',
    },
    [...words(shortOpening, palette.fg, size), ...words(closing, palette.ink, size)],
  );
}

/**
 * Corpo da manchete pelo tamanho do texto: o template usa 76px em frases curtas.
 * @example headlineSize('8 anos de código. De HTML a React.') // 76
 */
export function headlineSize(text: string): number {
  if (text.length <= 36) return 76;
  if (text.length <= 52) return 60;
  return 48;
}

/** O Satori não quebra texto entre elementos: cada palavra vira um nó com espaço à direita. */
function words(text: string, color: string, size: number): CardNode[] {
  const gap = Math.round(size * 0.25);
  return text
    .split(' ')
    .map((word) =>
      word === STAR_CHAR
        ? starGlyph(color, size, gap)
        : node('span', { color, marginRight: gap }, word),
    );
}

function bigNumber(snapshot: ProfileSnapshot, palette: CardPalette): CardNode {
  const { repos, activeYears } = snapshot.stats;
  return node('div', { display: 'flex', flexDirection: 'column', gap: 4, marginTop: 36 }, [
    node(
      'div',
      {
        fontSize: 180,
        lineHeight: 0.85,
        fontWeight: 900,
        letterSpacing: '-0.05em',
        color: palette.ink,
      },
      formatInteger(repos),
    ),
    node(
      'div',
      { fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em' },
      `${repos === 1 ? 'repositório' : 'repositórios'} em ${plural(activeYears, 'ano', 'anos')}`,
    ),
  ]);
}

function indicators(snapshot: ProfileSnapshot, palette: CardPalette): CardNode {
  const { stats } = snapshot;
  const items: Array<[string, string]> = [
    [formatInteger(stats.repos), 'repositórios'],
    [formatCompact(stats.ownStars), 'stars'],
    [formatInteger(stats.languageCount), 'linguagens'],
  ];
  return node(
    'div',
    { display: 'flex', gap: 28 },
    items.map(([value, label]) =>
      node('div', { display: 'flex', flexDirection: 'column' }, [
        node('div', { fontSize: 30, fontWeight: 800 }, value),
        node('div', { fontSize: 15, color: palette.muted }, label),
      ]),
    ),
  );
}

function monthGrid(snapshot: ProfileSnapshot, palette: CardPalette): CardNode {
  const years = Object.keys(snapshot.months)
    .map(Number)
    .sort((a, b) => a - b)
    .slice(-GRID_YEARS);
  const max = maxMonth(snapshot.months);
  return node(
    'div',
    { display: 'flex', flexDirection: 'column', gap: 6 },
    years.map((year) =>
      node('div', { display: 'flex', alignItems: 'center', gap: 5 }, [
        node(
          'div',
          { width: 52, fontSize: 14, color: palette.muted, fontFamily: 'JetBrains Mono' },
          String(year),
        ),
        ...(snapshot.months[year] ?? []).map((count) =>
          node(
            'div',
            {
              width: CELL,
              height: CELL,
              borderRadius: 5,
              background: palette.levels[contributionLevel(count, max)],
            },
            null,
          ),
        ),
      ]),
    ),
  );
}

function topLanguages(snapshot: ProfileSnapshot): CardNode {
  const top = snapshot.languages.filter((share) => share.name !== 'Outras').slice(0, 3);
  return node(
    'div',
    { display: 'flex', gap: 16, marginTop: 18, paddingLeft: 57, fontSize: 15 },
    top.map((share) =>
      node('div', { display: 'flex', alignItems: 'center', gap: 7 }, [
        node(
          'div',
          { width: 12, height: 12, borderRadius: 6, background: languageColor(share.name) },
          null,
        ),
        node('div', { display: 'flex' }, share.name),
      ]),
    ),
  );
}

function siteTag(palette: CardPalette): CardNode {
  const style = {
    position: 'absolute',
    right: 60,
    top: 56,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 15,
    color: palette.muted,
    fontFamily: 'JetBrains Mono',
  };
  return node('div', style, [
    node('div', { width: 20, height: 20, borderRadius: 10, background: palette.muted }, null),
    node('div', { display: 'flex' }, CANONICAL_HOST),
  ]);
}
