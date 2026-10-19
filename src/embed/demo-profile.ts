import { deriveSnapshot, type ProfileSnapshot } from '../domain/snapshot.js';
import type { CollectedProfile, Repo } from '../domain/types.js';

/** Data fixa: a prévia não muda de um dia para o outro nem acende meses "futuros". */
const DEMO_NOW = new Date('2026-12-31T12:00:00Z');

/** Carreira fictícia de 2019 a 2026 que passa por todas as formas dos embeds. */
const DEMO_LANGUAGES: ReadonlyArray<readonly [number, readonly string[]]> = [
  [2019, ['HTML', 'HTML', 'CSS', 'JavaScript']],
  [2020, ['JavaScript', 'JavaScript', 'JavaScript', 'HTML', 'CSS']],
  [2021, ['JavaScript', 'TypeScript', 'TypeScript', 'Python', 'JavaScript', 'Shell']],
  [2022, ['TypeScript', 'TypeScript', 'Python', 'Python', 'Go', 'Dockerfile', 'TypeScript']],
  [2023, ['Python', 'Python', 'Go', 'TypeScript', 'Python', 'Jupyter Notebook']],
  [2024, ['Go', 'Go', 'Python', 'Rust', 'TypeScript']],
  [2025, ['Rust', 'Go', 'Rust', 'Python', 'TypeScript', 'Go', 'Rust']],
  [2026, ['Rust', 'Go', 'TypeScript', 'Rust']],
];

/** Contribuições por mês: começo tímido, um pico em 2023 e ritmo estável depois. */
const DEMO_MONTHS: Readonly<Record<number, number[]>> = {
  2019: [0, 0, 2, 5, 8, 3, 0, 12, 20, 14, 6, 2],
  2020: [10, 18, 25, 40, 31, 22, 15, 9, 30, 44, 38, 20],
  2021: [35, 50, 62, 48, 70, 55, 41, 33, 80, 95, 77, 40],
  2022: [60, 88, 120, 140, 110, 90, 75, 66, 130, 160, 150, 85],
  2023: [140, 190, 260, 310, 280, 240, 205, 180, 290, 340, 320, 210],
  2024: [150, 170, 210, 230, 190, 160, 120, 140, 220, 250, 230, 180],
  2025: [160, 200, 240, 260, 230, 210, 170, 150, 240, 280, 260, 200],
  2026: [180, 210, 250, 270, 240, 220, 190, 170, 260, 290, 270, 230],
};

/**
 * Snapshot do perfil de exemplo das prévias da landing, com o username informado
 * (já traduzido para o idioma da página).
 * @example renderTrail(demoSnapshot('seu-usuario'), 'escuro', 'pt-BR')
 */
export function demoSnapshot(username: string): ProfileSnapshot {
  return deriveSnapshot(demoProfile(username), DEMO_NOW);
}

function demoProfile(username: string): CollectedProfile {
  return {
    account: {
      ...{ username, name: null, avatarUrl: '', bio: null },
      ...{ htmlUrl: `https://github.com/${username}`, createdAt: '2019-03-01T00:00:00Z' },
      type: 'User',
    },
    repos: demoRepos(),
    months: DEMO_MONTHS,
    orgContributions: [],
  };
}

function demoRepos(): Repo[] {
  return DEMO_LANGUAGES.flatMap(([year, languages]) =>
    languages.map((language, index) => demoRepo(year, language, index)),
  );
}

/** Prefixos dos nomes fictícios; o índice do repo no ano escolhe um. */
const DEMO_NAMES = ['site', 'api', 'cli', 'bot', 'lab', 'app', 'kit'] as const;

/** O repo que passa de 100 stars, para a conquista aparecer desbloqueada. */
function starred(year: number, index: number): boolean {
  return year === 2022 && index === 0;
}

/** Stars e topics só nos repos que precisam deles para desbloquear conquistas. */
function demoRepo(year: number, language: string, index: number): Repo {
  const name = starred(year, index) ? 'awesome-cli' : `${DEMO_NAMES[index] ?? 'lab'}-${year}`;
  return {
    ...{ name, url: `https://github.com/example/${name}`, description: null, language },
    topics: [`${language.toLowerCase()}-${year}`, `projeto-${year}-${index}`],
    stars: starred(year, index) ? 240 : index,
    ...{ forks: 0, isFork: false, archived: false, homepage: null, sizeKb: 100 },
    createdAt: `${year}-${String((index % 12) + 1).padStart(2, '0')}-10T00:00:00Z`,
    ...{ pushedAt: null, firstForkAt: year === 2021 ? '2022-02-01T00:00:00Z' : null },
  };
}
