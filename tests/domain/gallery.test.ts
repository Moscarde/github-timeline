import { describe, expect, it } from 'vitest';
import { GALLERY_MONTHS, galleryCard, isGalleryEligible } from '../../src/domain/gallery.js';
import { deriveSnapshot } from '../../src/domain/snapshot.js';
import { makeAccount, repoIn } from '../fakes/repo-factory.js';

const NOW = new Date('2026-09-30T00:00:00Z');

describe('galleryCard', () => {
  it('resume o snapshot com minigrade de 48 meses', () => {
    const snapshot = deriveSnapshot(
      {
        account: makeAccount({ username: 'dev', name: null, createdAt: '2011-05-01T00:00:00Z' }),
        repos: [repoIn(2020, { language: 'C', stars: 1500 }), repoIn(2021, { language: 'C' })],
        months: { 2026: [0, 0, 0, 0, 0, 0, 0, 0, 8] },
        orgContributions: [],
      },
      NOW,
    );
    const card = galleryCard(snapshot, 2, NOW);
    expect(card).toMatchObject({
      username: 'dev',
      name: 'dev',
      since: 2011,
      language: 'C',
      repos: 2,
      stars: 1500,
      rank: 2,
    });
    expect(card.levels).toHaveLength(GALLERY_MONTHS);
    expect(card.levels.at(-1)).toBe(4);
  });

  it('organizações e perfis vazios não entram', () => {
    const empty = deriveSnapshot(
      { account: makeAccount(), repos: [], months: {}, orgContributions: [] },
      NOW,
    );
    const org = deriveSnapshot(
      {
        account: makeAccount({ type: 'Organization' }),
        repos: [repoIn(2020)],
        months: {},
        orgContributions: [],
      },
      NOW,
    );
    expect(isGalleryEligible(empty)).toBe(false);
    expect(isGalleryEligible(org)).toBe(false);
  });
});
