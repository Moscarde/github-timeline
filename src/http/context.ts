import type { CardRenderer } from '../card/card-renderer.js';
import type { QuotaTracker } from '../github/quota.js';
import type { Logger } from '../lib/logger.js';
import type { ProfileService } from '../services/profile-service.js';
import type { ProgressHub } from '../services/progress-hub.js';

/** Dependências das rotas, injetadas em `createApp`. */
export interface AppDeps {
  profiles: ProfileService;
  progress: ProgressHub;
  cards: CardRenderer;
  quota: QuotaTracker;
  logger: Logger;
  /** Quanto a página espera a coleta antes de mostrar o estado "coletando". */
  collectWaitMs?: number;
}
