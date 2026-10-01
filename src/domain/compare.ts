import { formatCompact } from './format.js';
import type { ProfileSnapshot } from './snapshot.js';

/** Uma métrica da comparação (§2.4): valores formatados e largura relativa ao maior. */
export interface CompareRow {
  label: string;
  a: string;
  b: string;
  /** 0–1: fração do maior valor entre os dois perfis. */
  aRatio: number;
  bRatio: number;
}

/**
 * Barras proporcionais ao maior valor para repositórios, stars, anos e linguagens.
 * @example compareProfiles(a, b)[0] // { label: 'repositórios', a: '126', b: '364', … }
 */
export function compareProfiles(a: ProfileSnapshot, b: ProfileSnapshot): CompareRow[] {
  const metrics: Array<[string, number, number]> = [
    ['repositórios', a.stats.repos, b.stats.repos],
    ['stars', a.stats.ownStars, b.stats.ownStars],
    ['anos', a.stats.activeYears, b.stats.activeYears],
    ['linguagens', a.stats.languageCount, b.stats.languageCount],
  ];
  return metrics.map(([label, left, right]) => {
    const max = Math.max(left, right, 1);
    return {
      label,
      a: formatCompact(left),
      b: formatCompact(right),
      aRatio: left / max,
      bRatio: right / max,
    };
  });
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
