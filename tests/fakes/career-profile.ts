import { deriveSnapshot, type ProfileSnapshot } from '../../src/domain/snapshot.js';
import type { CollectedProfile, Repo } from '../../src/domain/types.js';
import { makeAccount, repoIn } from './repo-factory.js';

/** Data fixa da coleta: meses depois de outubro de 2026 contam como futuros. */
export const CAREER_NOW = new Date('2026-10-19T12:00:00Z');

/** Linguagens por ano, no formato do perfil que inspirou os embeds (HTML → JS → Python). */
const CAREER_LANGUAGES: ReadonlyArray<readonly [number, ReadonlyArray<readonly [string, number]>]> =
  [
    [
      2021,
      [
        ['HTML', 3],
        ['CSS', 1],
      ],
    ],
    [
      2022,
      [
        ['JavaScript', 3],
        ['HTML', 1],
      ],
    ],
    [
      2023,
      [
        ['JavaScript', 4],
        ['Python', 2],
        ['C', 1],
      ],
    ],
    [
      2024,
      [
        ['Python', 3],
        ['Jupyter Notebook', 1],
      ],
    ],
    [2025, [['Python', 5]]],
    [
      2026,
      [
        ['TypeScript', 2],
        ['Python', 1],
        ['Shell', 1],
      ],
    ],
  ];

function careerRepos(): Repo[] {
  const own = CAREER_LANGUAGES.flatMap(([year, languages]) =>
    languages.flatMap(([language, count]) =>
      Array.from({ length: count }, () => repoIn(year, { language, topics: ['<tag>'] })),
    ),
  );
  return [
    ...own,
    repoIn(2024, { language: 'Rust', isFork: true }),
    repoIn(2025, { stars: 55, language: 'Python', name: 'Junior_Zone' }),
  ];
}

/**
 * Perfil coletado com seis anos de repositórios e contribuições mensais.
 * @example harness.addProfile(careerProfile('ana'))
 */
export function careerProfile(username = 'dev'): CollectedProfile {
  return {
    account: makeAccount({ username, name: 'Dev <script>' }),
    repos: careerRepos(),
    months: {
      2021: [0, 1, 0, 0, 0, 0, 0, 1, 20, 4, 0, 0],
      2022: [0, 0, 0, 0, 10, 7, 39, 0, 0, 0, 0, 0],
      2023: [0, 0, 18, 30, 4, 0, 0, 0, 28, 98, 160, 71],
      2024: [64, 39, 64, 64, 15, 21, 18, 3, 43, 21, 5, 44],
      2025: [213, 203, 290, 309, 260, 221, 261, 183, 137, 69, 187, 397],
      2026: [138, 252, 207, 250, 298, 279, 296, 218, 384, 361, 0, 0],
    },
    orgContributions: [],
  };
}

/**
 * Snapshot derivado de `careerProfile`, pronto para os renderizadores.
 * @example renderTrail(careerSnapshot(), 'escuro', 'pt-BR')
 */
export function careerSnapshot(username = 'dev'): ProfileSnapshot {
  return deriveSnapshot(careerProfile(username), CAREER_NOW);
}
