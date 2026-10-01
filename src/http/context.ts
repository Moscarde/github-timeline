import type { CardRenderer } from '../card/card-renderer.js';
import type { UsernameSuggester } from '../github/username-suggester.js';
import type { QuotaTracker } from '../github/quota.js';
import type { Logger } from '../lib/logger.js';
import type { RateLimiter } from '../lib/rate-limiter.js';
import type { GalleryTab } from '../services/gallery-service.js';
import type { ProfileService } from '../services/profile-service.js';
import type { ProgressHub } from '../services/progress-hub.js';

/** O que a landing precisa da galeria (§2.1). */
export interface GallerySource {
  tabs(): GalleryTab[];
  warmCurated(): void;
}

/** Contador semanal e registro de visitas (§2.1, §8). */
export interface VisitCounter {
  record(username: string, ip: string): void;
  weeklyCount(): number;
}

/** Dependências das rotas, injetadas em `createApp`. */
export interface AppDeps {
  profiles: ProfileService;
  progress: ProgressHub;
  cards: CardRenderer;
  quota: QuotaTracker;
  logger: Logger;
  gallery: GallerySource;
  visits: VisitCounter;
  suggester: UsernameSuggester;
  /** Stars do repositório do projeto; `null` enquanto a primeira leitura não chega. */
  projectStars: { current(): number | null };
  /** Coletas novas por IP (§8, "Abuso"). */
  collectLimiter: RateLimiter;
  now: () => Date;
  /** Quanto a página espera a coleta antes de mostrar o estado "coletando". */
  collectWaitMs?: number;
}
