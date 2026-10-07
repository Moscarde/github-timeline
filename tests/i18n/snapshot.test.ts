import { describe, expect, it } from 'vitest';
import { deriveSnapshot } from '../../src/domain/snapshot.js';
import { localizeSnapshot } from '../../src/i18n/snapshot.js';
import { localizedProfile } from '../fakes/localized-profile.js';
import { repoIn } from '../fakes/repo-factory.js';

const now = new Date('2026-09-30T12:00:00Z');

describe('snapshot localization', () => {
  it('keeps Portuguese snapshots and translates a separate English copy', () => {
    const original = deriveSnapshot(localizedProfile(), now);
    const originalJson = JSON.stringify(original);
    const english = localizeSnapshot(original, 'en');
    expect(localizeSnapshot(original, 'pt-BR')).toBe(original);
    expect(english.headline.full).toBe('6 years. 2 repositories. 1.2k ★ on Uma década.');
    expect(english.headline.short).toBe('6 years of code. 1.2k ★ on Uma década.');
    expect(english.achievements.find((item) => item.id === 'stars-100')?.detail).toBe('Uma década');
    expect(english.achievements.find((item) => item.id === 'stars-1000')?.detail).toBe(
      'Uma década',
    );
    expect(english.achievements.find((item) => item.id === 'uma-decada')?.mark).toBe('10y');
    expect(english.timeline[0]?.title).toBe('Starting with Go');
    expect(english.timeline[0]?.repos[0]?.description).toBe('Descrição em português <&>');
    expect(JSON.stringify(original)).toBe(originalJson);
  });

  it('translates transition and loyal headlines with singular counts', () => {
    const profile = localizedProfile();
    const transition = deriveSnapshot(
      {
        ...profile,
        repos: [
          repoIn(2019, { language: 'Go' }),
          repoIn(2020, { language: 'Go' }),
          repoIn(2023, { language: 'Rust' }),
          repoIn(2024, { language: 'Rust' }),
        ],
      },
      now,
    );
    expect(localizeSnapshot(transition, 'en').headline.full).toBe(
      '6 years. 4 repositories. From Go to Rust.',
    );
    const loyal = deriveSnapshot({ ...profile, repos: [repoIn(2024, { language: 'Go' })] }, now);
    expect(localizeSnapshot(loyal, 'en').headline.full).toBe(
      '1 year. 1 repository. Loyal to Go since 2024.',
    );
    const empty = deriveSnapshot({ ...profile, repos: [] }, now);
    expect(localizeSnapshot(empty, 'en').headline.closing).toBe('The story is beginning.');
  });

  it('translates polyglot headlines and all achievement titles', () => {
    const repos = ['Go', 'Rust', 'Python', 'C', 'Java', 'Ruby'].map((language) =>
      repoIn(2024, { language }),
    );
    const snapshot = localizeSnapshot(deriveSnapshot({ ...localizedProfile(), repos }, now), 'en');
    expect(snapshot.headline.closing).toContain('6 languages,');
    expect(snapshot.headline.closing).toContain('first.');
    expect(snapshot.achievements.map((item) => item.title)).toEqual([
      'First repo',
      'Starred',
      '100 stars',
      '1,000 stars',
      'First fork',
      'Polyglot',
      'Record year',
      'A decade',
      '50 topics',
    ]);
  });
});
