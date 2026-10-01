import { yearOf } from '../domain/format.js';
import type { CollectedProfile, GithubAccount } from '../domain/types.js';
import type { GithubTransport } from './client.js';
import { fetchContributionHistory } from './contributions.js';
import { toAccount, type RestUser } from './mappers.js';
import { fetchOwnedRepos } from './repositories.js';

/** Etapas mostradas no painel de progresso (§6). */
export type CollectionStage = 'perfil' | 'repositorios' | 'contribuicoes' | 'conquistas';

export interface CollectionProgress {
  stage: CollectionStage;
  account?: GithubAccount;
}

export type ProgressListener = (progress: CollectionProgress) => void;

/** Coleta os dados brutos de um perfil (§3). */
export interface ProfileCollector {
  /** Devolve `null` quando o login não existe. */
  collect(login: string, onProgress?: ProgressListener): Promise<CollectedProfile | null>;
}

/**
 * Coletor sobre a API do GitHub com o token do servidor. Repositórios e contribuições são
 * buscados em paralelo.
 * @example await new GithubProfileCollector(transport, () => new Date()).collect('torvalds')
 */
export class GithubProfileCollector implements ProfileCollector {
  constructor(
    private readonly transport: GithubTransport,
    private readonly now: () => Date,
  ) {}

  async collect(
    login: string,
    onProgress: ProgressListener = () => {},
  ): Promise<CollectedProfile | null> {
    const raw = await this.transport.getJson(`/users/${encodeURIComponent(login)}`);
    if (raw === null) return null;
    const account = toAccount(raw);
    onProgress({ stage: 'perfil', account });
    if (account.type === 'Organization') {
      return { account, repos: [], months: {}, orgContributions: [] };
    }
    const [repos, history] = await Promise.all([
      this.reposOf(account, publicRepoCount(raw), onProgress),
      this.contributionsOf(account, onProgress),
    ]);
    return { account, repos, ...history };
  }

  private async reposOf(account: GithubAccount, publicRepos: number, onProgress: ProgressListener) {
    const repos = await fetchOwnedRepos(this.transport, account.login, publicRepos);
    onProgress({ stage: 'repositorios', account });
    return repos;
  }

  private async contributionsOf(account: GithubAccount, onProgress: ProgressListener) {
    const years = yearRange(yearOf(account.createdAt), this.now().getUTCFullYear());
    const history = await fetchContributionHistory(this.transport, account.login, years);
    onProgress({ stage: 'contribuicoes', account });
    return history;
  }
}

function publicRepoCount(raw: unknown): number {
  const count = (raw as Partial<RestUser>).public_repos;
  return typeof count === 'number' && count >= 0 ? count : 0;
}

function yearRange(first: number, last: number): number[] {
  return Array.from({ length: Math.max(0, last - first + 1) }, (_, index) => first + index);
}
