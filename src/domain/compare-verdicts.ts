import { leaderOf, type CompareSide } from './compare.js';
import { formatRatio, plural } from './format.js';
import type { ProfileSnapshot } from './snapshot.js';

/** Frase curta do topo da comparação; `side` é quem a frase descreve (o username vem antes). */
export interface Verdict {
  side: CompareSide | null;
  text: string;
}

/** Abaixo disso a diferença não rende uma frase ("1,2× mais" é ruído). */
const RATIO_MIN = 1.5;

/**
 * Até quatro frases que resumem o duelo: repositórios, stars, estreia e linguagens em comum.
 * @example compareVerdicts(a, b)[0] // { side: 'b', text: 'criou 30× mais repositórios' }
 */
export function compareVerdicts(a: ProfileSnapshot, b: ProfileSnapshot): Verdict[] {
  const verdicts = [
    ratioVerdict(a.stats.repos, b.stats.repos, (ratio) => `criou ${ratio} mais repositórios`),
    ratioVerdict(a.stats.ownStars, b.stats.ownStars, (ratio) => `tem ${ratio} mais stars`),
    debutVerdict(a.stats.firstYear, b.stats.firstYear),
    sharedLanguagesVerdict(sharedLanguages(a, b)),
  ];
  return verdicts.filter((verdict): verdict is Verdict => verdict !== null);
}

/** Sem frase quando um dos lados é zero: "500× mais stars" que alguém sem nenhuma engana. */
function ratioVerdict(a: number, b: number, describe: (ratio: string) => string): Verdict | null {
  const low = Math.min(a, b);
  const high = Math.max(a, b);
  if (low === 0 || high / low < RATIO_MIN) return null;
  return { side: leaderOf(a, b), text: describe(formatRatio(high / low)) };
}

function debutVerdict(a: number | null, b: number | null): Verdict | null {
  if (a === null || b === null) return null;
  if (a === b) return { side: null, text: `mesmo ano de estreia: ${a}` };
  return {
    side: a < b ? 'a' : 'b',
    text: `começou ${plural(Math.abs(a - b), 'ano', 'anos')} antes`,
  };
}

function sharedLanguagesVerdict(shared: string[]): Verdict {
  if (!shared.length) return { side: null, text: 'nenhuma linguagem em comum' };
  return { side: null, text: plural(shared.length, 'linguagem em comum', 'linguagens em comum') };
}

/**
 * Linguagens que os dois usaram, na ordem em que A as adotou. Vem dos capítulos da timeline,
 * onde cada linguagem aparece uma vez, no ano da estreia.
 * @example sharedLanguages(a, b) // ['JavaScript', 'HTML']
 */
export function sharedLanguages(a: ProfileSnapshot, b: ProfileSnapshot): string[] {
  const fromB = new Set(languagesOf(b));
  return languagesOf(a).filter((language) => fromB.has(language));
}

function languagesOf(snapshot: ProfileSnapshot): string[] {
  return snapshot.timeline.flatMap((era) => era.newLanguages);
}
