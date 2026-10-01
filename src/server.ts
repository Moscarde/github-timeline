import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { createImageFetcher, SatoriCardRenderer } from './card/card-renderer.js';
import { loadCardFonts } from './card/fonts.js';
import type Database from 'better-sqlite3';
import { loadConfig, PROJECT_REPO, type AppConfig } from './config.js';
import { GithubHttpClient } from './github/client.js';
import { GithubProfileCollector } from './github/collector.js';
import { GithubUsernameSuggester } from './github/username-suggester.js';
import { ProjectStars } from './github/project-stars.js';
import { QuotaTracker } from './github/quota.js';
import { createApp } from './http/app.js';
import type { AppDeps } from './http/context.js';
import { JsonLogger } from './lib/logger.js';
import { FixedWindowRateLimiter } from './lib/rate-limiter.js';
import { GalleryService, type CuratedLists } from './services/gallery-service.js';
import { ProfileService } from './services/profile-service.js';
import { ProgressHub } from './services/progress-hub.js';
import { VisitTracker } from './services/visit-tracker.js';
import { openDatabase } from './storage/database.js';
import { SqliteSnapshotStore } from './storage/snapshot-store.js';
import { SqliteVisitStore } from './storage/visit-store.js';

const PUBLIC_DIR = 'public';
const CURATED_FILE = 'data/curated.json';
const STATIC_CACHE = 'public, max-age=86400';
/** Coletas simultâneas no processo inteiro; cada uma abre até 10 requisições ao GitHub. */
const MAX_CONCURRENT_COLLECTIONS = 3;
/** Timelines novas por IP a cada 10 minutos (§8, "Abuso"); perfis salvos não contam. */
const NEW_COLLECTIONS_PER_IP = 10;
const COLLECT_WINDOW_MS = 10 * 60 * 1000;

/** Raiz de composição: cria as dependências reais e sobe o servidor HTTP. */
async function main(): Promise<void> {
  const config = loadConfig(process.env);
  const logger = new JsonLogger();
  const deps = await buildDeps(config, logger);
  const server = new Hono();
  const staticFiles = serveStatic({
    root: PUBLIC_DIR,
    onFound: (_path, c) => c.header('Cache-Control', STATIC_CACHE),
  });
  for (const path of ['/assets/*', '/fonts/*', '/favicon.svg']) server.use(path, staticFiles);
  server.route('/', createApp(deps));
  serve({ fetch: server.fetch, port: config.port }, (info) =>
    logger.log('info', 'server.listening', { port: info.port }),
  );
}

async function buildDeps(config: AppConfig, logger: JsonLogger): Promise<AppDeps> {
  const quota = new QuotaTracker();
  const progress = new ProgressHub();
  const now = () => new Date();
  const transport = new GithubHttpClient({ token: config.githubToken, fetch, quota });
  const db = openDatabase(config.databasePath);
  const profiles = new ProfileService({
    collector: new GithubProfileCollector(transport, now),
    store: new SqliteSnapshotStore(db),
    ...{ quota, progress, logger, now },
    maxConcurrentCollections: MAX_CONCURRENT_COLLECTIONS,
  });
  const visits = buildVisits(config, db, now);
  return {
    ...{ profiles, progress, quota, logger, visits, now },
    gallery: await buildGallery(profiles, visits, logger, now),
    cards: new SatoriCardRenderer({
      fonts: await loadCardFonts(),
      fetchImage: createImageFetcher(fetch, 3000),
    }),
    suggester: new GithubUsernameSuggester(transport, now),
    projectStars: new ProjectStars(transport, PROJECT_REPO, now),
    collectLimiter: new FixedWindowRateLimiter({
      limit: NEW_COLLECTIONS_PER_IP,
      windowMs: COLLECT_WINDOW_MS,
      now,
    }),
  };
}

/**
 * Sem VISIT_SALT, o sal muda a cada reinício: os hashes do dia deixam de casar, o que só
 * pode contar a mesma pessoa duas vezes; nunca expõe o IP.
 */
function buildVisits(config: AppConfig, db: Database.Database, now: () => Date): VisitTracker {
  const salt = config.visitSalt ?? randomBytes(16).toString('hex');
  return new VisitTracker({ store: new SqliteVisitStore(db), salt, now });
}

async function buildGallery(
  profiles: ProfileService,
  visits: VisitTracker,
  logger: JsonLogger,
  now: () => Date,
): Promise<GalleryService> {
  const curated = JSON.parse(await readFile(CURATED_FILE, 'utf8')) as CuratedLists;
  const trending = (limit: number) => visits.trending(limit);
  return new GalleryService({ profiles, trending, curated, logger, now });
}

main().catch((error: unknown) => {
  new JsonLogger().log('error', 'server.start_failed', { error: String(error) });
  process.exit(1);
});
