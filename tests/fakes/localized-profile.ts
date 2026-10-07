import type { CollectedProfile } from '../../src/domain/types.js';
import { makeAccount, repoIn } from './repo-factory.js';

/** Public profile with recognizable user content. @example localizedProfile('ana') */
export function localizedProfile(username = 'dev'): CollectedProfile {
  return {
    account: makeAccount({ username, name: 'Nome público <&>' }),
    repos: [
      repoIn(2019, {
        name: 'Uma década',
        language: 'Go',
        stars: 1234,
        description: 'Descrição em português <&>',
      }),
      repoIn(2024, { name: 'repositorio-recente', language: 'Rust', stars: 20 }),
    ],
    months: { 2024: [1234, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    orgContributions: [],
  };
}
