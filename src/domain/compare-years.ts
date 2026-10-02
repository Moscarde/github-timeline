import type { ProfileSnapshot } from './snapshot.js';
import type { Era } from './timeline.js';

/** O que um perfil fez num ano: o capítulo (se criou repositórios) e os 12 meses. */
export interface CompareYearSide {
  era: Era | null;
  months: number[];
}

/** Uma linha do "Ano a ano": o mesmo ano de calendário para os dois perfis. */
export interface CompareYear {
  year: number;
  a: CompareYearSide;
  b: CompareYearSide;
}

/**
 * Eixo de anos comum, do primeiro ao último capítulo de qualquer um dos dois, sem buracos:
 * um ano parado de um lado aparece vazio, alinhado ao ano do outro.
 * @example alignYears(a, b).map((row) => row.year) // [2011, 2012, …, 2026]
 */
export function alignYears(a: ProfileSnapshot, b: ProfileSnapshot): CompareYear[] {
  const years = yearSpan([...a.timeline, ...b.timeline].map((era) => era.year));
  return years.map((year) => ({ year, a: sideOf(a, year), b: sideOf(b, year) }));
}

function yearSpan(years: number[]): number[] {
  if (!years.length) return [];
  const first = Math.min(...years);
  return Array.from({ length: Math.max(...years) - first + 1 }, (_, index) => first + index);
}

function sideOf(snapshot: ProfileSnapshot, year: number): CompareYearSide {
  return {
    era: snapshot.timeline.find((era) => era.year === year) ?? null,
    months: snapshot.months[year] ?? Array<number>(12).fill(0),
  };
}
