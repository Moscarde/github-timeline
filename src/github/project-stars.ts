import type { GithubTransport } from './client.js';

const DEFAULT_TTL_MS = 60 * 60 * 1000;

/**
 * Stars do repositório do projeto, para o botão "Star" da topbar. A leitura nunca espera a
 * API: devolve o último valor conhecido e atualiza em segundo plano quando vence.
 * @example new ProjectStars(transport, 'Moscarde/github-timeline', () => new Date()).current()
 */
export class ProjectStars {
  private value: number | null = null;
  private expires = 0;
  private refreshing = false;

  constructor(
    private readonly transport: GithubTransport,
    private readonly repo: string,
    private readonly now: () => Date,
    private readonly ttlMs = DEFAULT_TTL_MS,
  ) {}

  current(): number | null {
    if (this.now().getTime() >= this.expires) void this.refresh();
    return this.value;
  }

  private async refresh(): Promise<void> {
    if (this.refreshing) return;
    this.refreshing = true;
    try {
      const raw = (await this.transport.getJson(`/repos/${this.repo}`)) as {
        stargazers_count?: number;
      } | null;
      if (typeof raw?.stargazers_count === 'number') this.value = raw.stargazers_count;
    } catch {
      // Sem a contagem, o botão aparece sem número; nova tentativa no próximo vencimento.
    } finally {
      this.expires = this.now().getTime() + this.ttlMs;
      this.refreshing = false;
    }
  }
}
