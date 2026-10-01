import { describe, expect, it } from 'vitest';
import { deriveSnapshot, type ProfileSnapshot } from '../../src/domain/snapshot.js';
import { GalleryService, type GallerySnapshots } from '../../src/services/gallery-service.js';
import { makeAccount, repoIn } from '../fakes/repo-factory.js';
import { MemoryLogger } from '../fakes/memory-logger.js';

const NOW = new Date('2026-09-30T00:00:00Z');

/** Perfis salvos em memória; `getProfile` registra os usernames aquecidos. */
class StoredProfiles implements GallerySnapshots {
  readonly stored = new Map<string, ProfileSnapshot>();
  readonly warmed: string[] = [];

  add(username: string, repos = 1): this {
    const snapshot = deriveSnapshot(
      {
        account: makeAccount({ username }),
        repos: Array.from({ length: repos }, () => repoIn(2020)),
        months: {},
        orgContributions: [],
      },
      NOW,
    );
    this.stored.set(username.toLowerCase(), snapshot);
    return this;
  }

  findStored(username: string): ProfileSnapshot | null {
    return this.stored.get(username.toLowerCase()) ?? null;
  }

  async getProfile(username: string): Promise<unknown> {
    this.warmed.push(username);
    return null;
  }
}

function galleryWith(profiles: StoredProfiles, trending: string[] = []) {
  return new GalleryService({
    profiles,
    trending: () => trending,
    curated: { lendas: ['torvalds', 'tj', 'vazio'], brasil: ['diego3g'], criadores: [] },
    logger: new MemoryLogger(),
    now: () => NOW,
  });
}

describe('GalleryService', () => {
  it('monta as abas na ordem editorial, só com snapshots elegíveis', () => {
    const profiles = new StoredProfiles().add('torvalds').add('vazio', 0).add('ana');
    const tabs = galleryWith(profiles, ['ana', 'ghost']).tabs();
    expect(tabs.map((tab) => tab.label)).toEqual([
      'Em alta',
      'Lendas',
      'Brasil',
      'Criadores de linguagem',
    ]);
    expect(tabs[0]?.cards.map((card) => [card.username, card.rank])).toEqual([['ana', 1]]);
    expect(tabs[1]?.cards.map((card) => card.username)).toEqual(['torvalds']);
    expect(tabs[2]?.cards).toEqual([]);
  });

  it('aquece uma vez por processo os curados sem snapshot', async () => {
    const profiles = new StoredProfiles().add('torvalds');
    const gallery = galleryWith(profiles);
    gallery.warmCurated();
    gallery.warmCurated();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(profiles.warmed.sort()).toEqual(['diego3g', 'tj', 'vazio']);
  });
});
