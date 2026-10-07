import type { Locale } from '../i18n/locale.js';
import { formatCompact } from './format.js';
import type { ProfileSnapshot } from './snapshot.js';
import { usernameKey } from './username.js';

/** Lado da comparação: A à esquerda (verde), B à direita (roxo). */
export type CompareSide = 'a' | 'b';

/** Uma métrica da comparação (§2.4): valores formatados e largura relativa ao maior. */
export interface CompareRow {
  label: string;
  a: string;
  b: string;
  /** 0–1: fração do maior valor entre os dois perfis. */
  aRatio: number;
  bRatio: number;
  /** Quem tem o maior valor; `null` no empate. */
  leader: CompareSide | null;
}

/** Conquista lado a lado: o mesmo catálogo, desbloqueada ou não em cada perfil. */
export interface AchievementPair {
  id: string;
  title: string;
  a: boolean;
  b: boolean;
}

/** Por que um perfil não entra na comparação: só pessoas com repositórios têm trajetória. */
export type ComparisonBlocker = 'organizacao' | 'vazio';

/**
 * Barras proporcionais ao maior valor para repositórios, stars, anos e linguagens.
 * @example compareProfiles(a, b)[0] // { label: 'repositórios', a: '126', b: '364', … }
 */
export function compareProfiles(
  a: ProfileSnapshot,
  b: ProfileSnapshot,
  locale: Locale = 'pt-BR',
): CompareRow[] {
  const metrics: Array<[string, number, number]> = [
    ['repositórios', a.stats.repos, b.stats.repos],
    ['stars nos próprios', a.stats.ownStars, b.stats.ownStars],
    ['anos de atividade', a.stats.activeYears, b.stats.activeYears],
    ['linguagens', a.stats.languageCount, b.stats.languageCount],
  ];
  return metrics.map(([label, left, right]) => compareRow(label, left, right, locale));
}

function compareRow(label: string, left: number, right: number, locale: Locale): CompareRow {
  const max = Math.max(left, right, 1);
  return {
    label,
    a: formatCompact(left, locale),
    b: formatCompact(right, locale),
    aRatio: left / max,
    bRatio: right / max,
    leader: leaderOf(left, right),
  };
}

/**
 * Lado com o maior valor; `null` no empate.
 * @example leaderOf(3, 9) // "b"
 */
export function leaderOf(a: number, b: number): CompareSide | null {
  if (a === b) return null;
  return a > b ? 'a' : 'b';
}

/**
 * Conquistas na ordem do catálogo, com o estado de cada lado.
 * @example compareAchievements(a, b)[0] // { id: 'primeiro-repo', title: 'Primeiro repo', a: true, b: true }
 */
export function compareAchievements(a: ProfileSnapshot, b: ProfileSnapshot): AchievementPair[] {
  const unlockedByB = new Set(
    b.achievements.filter((item) => item.unlocked).map((item) => item.id),
  );
  return a.achievements.map((item) => ({
    id: item.id,
    title: item.title,
    a: item.unlocked,
    b: unlockedByB.has(item.id),
  }));
}

/**
 * Organização ou perfil sem repositórios não têm trajetória para comparar (§6).
 * @example comparisonBlocker(orgSnapshot) // "organizacao"
 */
export function comparisonBlocker(snapshot: ProfileSnapshot): ComparisonBlocker | null {
  if (snapshot.account.type === 'Organization') return 'organizacao';
  return snapshot.stats.repos > 0 ? null : 'vazio';
}

/**
 * Caminho da comparação: `/u/<a>...<b>`.
 * @example comparePath('torvalds', 'gaearon') // "/u/torvalds...gaearon"
 */
export function comparePath(a: string, b: string): string {
  return `/u/${encodeURIComponent(a)}...${encodeURIComponent(b)}`;
}

/**
 * Lê `a...b` do parâmetro da rota; `null` se não for uma comparação.
 * @example parseComparePair('torvalds...gaearon') // ['torvalds', 'gaearon']
 */
export function parseComparePair(param: string): [string, string] | null {
  const parts = param.split('...');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return [parts[0], parts[1]];
}

/**
 * Mesmo perfil dos dois lados (o GitHub ignora maiúsculas): a rota manda para o perfil.
 * @example isSelfComparison('Torvalds', 'torvalds') // true
 */
export function isSelfComparison(a: string, b: string): boolean {
  return usernameKey(a) === usernameKey(b);
}
