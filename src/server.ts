import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { createImageFetcher, loadCardLogos, SatoriCardRenderer } from './card/card-renderer.js';
import { loadCardFonts } from './card/fonts.js';
import { loadConfig } from './config.js';
import { GithubHttpClient } from './github/client.js';
import { GithubProfileCollector } from './github/collector.js';
import { QuotaTracker } from './github/quota.js';
import { createApp } from './http/app.js';
import { JsonLogger } from './lib/logger.js';
import { ProfileService } from './services/profile-service.js';
import { ProgressHub } from './services/progress-hub.js';
import { openDatabase } from './storage/database.js';
import { SqliteSnapshotStore } from './storage/snapshot-store.js';

const PUBLIC_DIR = 'public';
const STATIC_CACHE = 'public, max-age=86400';

/** Raiz de composição: cria as dependências reais e sobe o servidor HTTP. */
async function main(): Promise<void> {
  const config = loadConfig(process.env);
  const logger = new JsonLogger();
  const quota = new QuotaTracker();
  const progress = new ProgressHub();
  const now = () => new Date();
  const transport = new GithubHttpClient({ token: config.githubToken, fetch, quota });
  const profiles = new ProfileService({
    collector: new GithubProfileCollector(transport, now),
    store: new SqliteSnapshotStore(openDatabase(config.databasePath)),
    quota,
    progress,
    logger,
    now,
  });
  const cards = new SatoriCardRenderer({
    fonts: await loadCardFonts(),
    logos: await loadCardLogos(`${PUBLIC_DIR}/brand`),
    fetchImage: createImageFetcher(fetch, 3000),
  });
  const server = new Hono();
  const staticFiles = serveStatic({
    root: PUBLIC_DIR,
    onFound: (_path, c) => c.header('Cache-Control', STATIC_CACHE),
  });
  for (const path of ['/assets/*', '/brand/*', '/fonts/*', '/favicon.ico'])
    server.use(path, staticFiles);
  server.route('/', createApp({ profiles, progress, cards, quota, logger }));
  serve({ fetch: server.fetch, port: config.port }, (info) =>
    logger.log('info', 'server.listening', { port: info.port }),
  );
}

main().catch((error: unknown) => {
  new JsonLogger().log('error', 'server.start_failed', { error: String(error) });
  process.exit(1);
});
