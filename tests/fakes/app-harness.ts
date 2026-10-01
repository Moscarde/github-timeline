import { QuotaTracker } from '../../src/github/quota.js';
import { createApp } from '../../src/http/app.js';
import { ProfileService } from '../../src/services/profile-service.js';
import { ProgressHub } from '../../src/services/progress-hub.js';
import type { CollectedProfile } from '../../src/domain/types.js';
import { InMemorySnapshotStore } from './in-memory-snapshot-store.js';
import { MemoryLogger } from './memory-logger.js';
import { RecordingCardRenderer } from './recording-card-renderer.js';
import { ScriptedCollector } from './scripted-collector.js';

/** App completo com fakes nomeados, para testar rotas via `app.request`. */
export function createAppHarness(collectWaitMs = 50) {
  const collector = new ScriptedCollector();
  const store = new InMemorySnapshotStore();
  const quota = new QuotaTracker();
  const progress = new ProgressHub();
  const logger = new MemoryLogger();
  const cards = new RecordingCardRenderer();
  const now = () => new Date('2026-09-30T12:00:00Z');
  const profiles = new ProfileService({ collector, store, quota, progress, logger, now });
  const app = createApp({ profiles, progress, cards, quota, logger, collectWaitMs });
  const addProfile = (profile: CollectedProfile) =>
    collector.profiles.set(profile.account.login.toLowerCase(), profile);
  return { app, collector, store, quota, cards, logger, profiles, addProfile };
}
