import type { Achievement, AchievementTone } from '../domain/achievements.js';
import type { ProfileSnapshot } from '../domain/snapshot.js';
import type { Locale } from '../i18n/locale.js';
import { message, translate } from '../i18n/translate.js';
import type { Theme } from '../lib/theme.js';
import { escapeMarkup } from '../lib/escape.js';
import {
  embedHeader,
  embedPalette,
  round,
  svgDocument,
  svgText,
  wrapWords,
  type EmbedPalette,
} from './svg-kit.js';

const TILE_PITCH = 88;
const TILE_SIZE = 60;
const TILE_TOP = 60;
const MIN_WIDTH = 420;
const HEIGHT = 214;
/** Cabe em 88 px em mono 9,5 px; até 3 linhas para o nome do repo não sumir. */
const DETAIL_CHARS = 15;

/** O que desenhar: o perfil e, opcionalmente, só algumas conquistas (já na ordem pedida). */
export interface AchievementStripInput {
  snapshot: ProfileSnapshot;
  theme: Theme;
  locale: Locale;
  selected?: Achievement[];
}

/**
 * Faixa de medalhas com as conquistas do snapshot. Sem `selected`, mostra todas e o placar
 * de desbloqueadas; com `selected`, só as escolhidas no path.
 * @example renderAchievementStrip({ snapshot, theme: 'escuro', locale: 'pt-BR' })
 */
export function renderAchievementStrip(input: AchievementStripInput): string {
  const palette = embedPalette(input.theme);
  const achievements = input.selected ?? input.snapshot.achievements;
  const width = Math.max(MIN_WIDTH, 48 + achievements.length * TILE_PITCH);
  const body =
    stripHeader(input, palette, width) +
    achievements.map((achievement, index) => medal(achievement, index, palette)).join('');
  const title = message('Conquistas de {0}: {1}', input.locale, [
    input.snapshot.account.username,
    achievements.map((achievement) => achievement.title).join(', '),
  ]);
  return svgDocument({ width, height: HEIGHT, title, palette, body });
}

function stripHeader(input: AchievementStripInput, palette: EmbedPalette, width: number): string {
  const { snapshot, locale } = input;
  const unlocked = snapshot.achievements.filter((achievement) => achievement.unlocked).length;
  const subtitle = input.selected
    ? `@${snapshot.account.username}`
    : message('{0} de {1} desbloqueadas', locale, [unlocked, snapshot.achievements.length]);
  return embedHeader({
    ...{ title: translate('Conquistas', locale), subtitle, width, palette },
    right: input.selected ? 'github timeline' : snapshot.account.username,
  });
}

function medal(achievement: Achievement, index: number, palette: EmbedPalette): string {
  const x = 24 + index * TILE_PITCH + (TILE_PITCH - TILE_SIZE) / 2 - 4;
  const center = x + TILE_SIZE / 2;
  const color = achievement.unlocked ? toneColor(achievement.tone, palette) : palette.faint;
  const tooltip = `<title>${escapeMarkup(`${achievement.title}: ${achievement.detail}`)}</title>`;
  return `<g>${tooltip}${tile(x, achievement.unlocked, color, palette)}${markText(achievement, center, color)}${caption(achievement, center, palette)}</g>`;
}

function toneColor(tone: AchievementTone, palette: EmbedPalette): string {
  const colors: Record<AchievementTone, string> = {
    ...{ brand: palette.accent, gold: palette.gold },
    ...{ blue: palette.blue, purple: palette.purple },
  };
  return colors[tone];
}

/** Desbloqueada: preenchida na cor do tom. Bloqueada: contorno tracejado, como no perfil. */
function tile(x: number, unlocked: boolean, color: string, palette: EmbedPalette): string {
  if (unlocked)
    return `<rect x="${round(x)}" y="${TILE_TOP}" width="${TILE_SIZE}" height="${TILE_SIZE}" rx="14" fill="${color}" fill-opacity=".14" stroke="${color}" stroke-width="1.5"/>`;
  return `<rect x="${round(x + 0.75)}" y="${TILE_TOP + 0.75}" width="${TILE_SIZE - 1.5}" height="${TILE_SIZE - 1.5}" rx="14" fill="none" stroke="${palette.faint}" stroke-dasharray="4 3"/>`;
}

function markText(achievement: Achievement, center: number, color: string): string {
  const size = [...achievement.mark].length > 2 ? 17 : 21;
  return svgText({
    ...{ x: center, y: TILE_TOP + TILE_SIZE / 2 + size / 3, size, font: 'mono', weight: 700 },
    ...{ anchor: 'middle', fill: color, content: achievement.mark },
  });
}

function caption(achievement: Achievement, center: number, palette: EmbedPalette): string {
  const title = svgText({
    ...{ x: center, y: TILE_TOP + TILE_SIZE + 22, size: 11, weight: 600, anchor: 'middle' },
    ...{ fill: achievement.unlocked ? palette.text : palette.muted, content: achievement.title },
  });
  const details = wrapWords(achievement.detail, DETAIL_CHARS, 3).map((line, index) =>
    svgText({
      ...{ x: center, y: TILE_TOP + TILE_SIZE + 37 + index * 12, size: 9.5, font: 'mono' },
      ...{ anchor: 'middle', fill: palette.faint, content: line },
    }),
  );
  return title + details.join('');
}
