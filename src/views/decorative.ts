import type { ContributionLevel } from '../domain/contributions.js';

/**
 * Sequência pseudoaleatória determinística (LCG do template): o SSR sai igual a cada visita,
 * sem `Math.random`.
 * @example const next = seededRandom(7); next() // 0.4…
 */
export function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

/**
 * Nível decorativo de contribuição; `bias` empurra para tons mais fortes.
 * @example decorativeLevel(seededRandom(7), 0.2) // 0–4
 */
export function decorativeLevel(next: () => number, bias = 0): ContributionLevel {
  const value = next() + bias;
  if (value < 0.35) return 0;
  if (value < 0.55) return 1;
  if (value < 0.75) return 2;
  return value < 0.9 ? 3 : 4;
}
