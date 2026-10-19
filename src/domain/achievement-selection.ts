import { ACHIEVEMENT_IDS, type Achievement, type AchievementId } from './achievements.js';

/** Limite de conquistas por embed: é o tamanho do catálogo (§4.2). */
const MAX_SELECTED = ACHIEVEMENT_IDS.length;

/** Resultado da leitura do trecho de URL com a seleção de conquistas. */
export type AchievementSelection =
  { ok: true; ids: AchievementId[] } | { ok: false; received: string; unknown: string[] };

/**
 * Lê a seleção do path `/embed/<user>/conquistas/<ids>.svg`. Ids separados por vírgula ou
 * `+`, sem diferenciar maiúsculas; repetidos são ignorados e a ordem pedida é mantida.
 * @example parseAchievementSelection('poliglota,ano-recorde.svg') // { ok: true, ids: ['poliglota', 'ano-recorde'] }
 */
export function parseAchievementSelection(raw: string): AchievementSelection {
  const received = raw.replace(/\.svg$/i, '');
  const tokens = received
    .toLowerCase()
    .split(/[,+]/)
    .map((token) => token.trim())
    .filter(Boolean);
  const unknown = tokens.filter((token) => !isAchievementId(token));
  if (tokens.length === 0 || unknown.length > 0) return { ok: false, received, unknown };
  const ids = [...new Set(tokens)] as AchievementId[];
  return { ok: true, ids: ids.slice(0, MAX_SELECTED) };
}

/**
 * Conquistas do snapshot na ordem pedida.
 * @example selectAchievements(snapshot.achievements, ['poliglota']).length // 1
 */
export function selectAchievements(all: Achievement[], ids: AchievementId[]): Achievement[] {
  return ids.flatMap((id) => all.filter((achievement) => achievement.id === id));
}

function isAchievementId(value: string): value is AchievementId {
  return (ACHIEVEMENT_IDS as readonly string[]).includes(value);
}
