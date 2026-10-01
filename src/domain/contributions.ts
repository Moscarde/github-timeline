import type { MonthlyContributions } from './types.js';

/** Intensidade de um mês na grade: 0 (nenhuma) a 4 (perto do maior mês do perfil). */
export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

/**
 * Intensidade 0–4 relativa ao maior mês do perfil.
 * @example contributionLevel(50, 100) // 2
 */
export function contributionLevel(count: number, max: number): ContributionLevel {
  if (count <= 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((count / max) * 4))) as ContributionLevel;
}

/**
 * Maior contagem mensal do perfil; nunca menor que 1, para servir de divisor.
 * @example maxMonth({ 2024: [1, 9, 3] }) // 9
 */
export function maxMonth(months: MonthlyContributions): number {
  return Math.max(1, ...Object.values(months).flat());
}

/**
 * Últimos `count` meses até `now`, em ordem cronológica; meses sem dado valem 0.
 * @example recentMonths({ 2026: [1, 2, 3] }, 2, new Date('2026-03-15')) // [2, 3]
 */
export function recentMonths(months: MonthlyContributions, count: number, now: Date): number[] {
  const values: number[] = [];
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  for (let index = 0; index < count; index++) {
    values.unshift(months[cursor.getUTCFullYear()]?.[cursor.getUTCMonth()] ?? 0);
    cursor.setUTCMonth(cursor.getUTCMonth() - 1);
  }
  return values;
}
