import { QuotaTracker } from '../../src/github/quota.js';
import { createApp } from '../../src/http/app.js';
import { FixedWindowRateLimiter } from '../../src/lib/rate-limiter.js';
import { GalleryService, type CuratedLists } from '../../src/services/gallery-service.js';
import { ProfileService } from '../../src/services/profile-service.js';
import { ProgressHub } from '../../src/services/progress-hub.js';
import { VisitTracker } from '../../src/services/visit-tracker.js';
import type { CollectedProfile } from '../../src/domain/types.js';
import { FixedUsernameSuggester } from './fixed-username-suggester.js';
import { InMemorySnapshotStore } from './in-memory-snapshot-store.js';
import { InMemoryVisitStore } from './in-memory-visit-store.js';
import { MemoryLogger } from './memory-logger.js';
import { RecordingCardRenderer } from './recording-card-renderer.js';
import { ScriptedCollector } from './scripted-collector.js';

/** App completo com fakes nomeados, para testar rotas via `app.request`. */
export function createAppHarness(collectWaitMs = 50, newCollectionsPerIp = 100) {
  const collector = new ScriptedCollector();
  const store = new InMemorySnapshotStore();
  const quota = new QuotaTracker();
  const progress = new ProgressHub();
  const logger = new MemoryLogger();
  const cards = new RecordingCardRenderer();
  const now = () => new Date('2026-09-30T12:00:00Z');
  const profiles = new ProfileService({ collector, store, quota, progress, logger, now });
  const visitStore = new InMemoryVisitStore();
  const visits = new VisitTracker({ store: visitStore, salt: 'teste', now });
  const curated: CuratedLists = { lendas: [], brasil: [], criadores: [] };
  const trending = (limit: number) => visits.trending(limit);
  const gallery = new GalleryService({ profiles, trending, curated, logger, now });
  const suggester = new FixedUsernameSuggester();
  const projectStars = { current: () => 1234 };
  const collectLimiter = new FixedWindowRateLimiter({
    limit: newCollectionsPerIp,
    windowMs: 10 * 60 * 1000,
    now,
  });
  const app = createApp({
    ...{ profiles, progress, cards, quota, logger, collectWaitMs },
    ...{ gallery, visits, suggester, projectStars, collectLimiter, now },
  });
  const addProfile = (profile: CollectedProfile) =>
    collector.profiles.set(profile.account.username.toLowerCase(), profile);
  return {
    ...{ app, collector, store, quota, cards, logger, profiles },
    ...{ addProfile, visitStore, curated, suggester },
  };
}
