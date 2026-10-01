/**
 * Limita quantas tarefas rodam ao mesmo tempo; as demais esperam em ordem de chegada.
 * @example const slots = new Semaphore(3); await slots.run(() => collect('torvalds'));
 */
export class Semaphore {
  private active = 0;
  private readonly waiters: Array<() => void> = [];

  constructor(private readonly limit: number) {
    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error(`Semaphore: recebido limite ${limit}, esperado inteiro ≥ 1.`);
    }
  }

  async run<T>(task: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await task();
    } finally {
      this.release();
    }
  }

  /** Tarefas esperando uma vaga. */
  get waiting(): number {
    return this.waiters.length;
  }

  /** Todas as vagas ocupadas: a próxima tarefa vai esperar. */
  get isFull(): boolean {
    return this.active >= this.limit;
  }

  private acquire(): Promise<void> {
    if (!this.isFull) {
      this.active += 1;
      return Promise.resolve();
    }
    return new Promise((resolve) => this.waiters.push(resolve));
  }

  /** A vaga passa direto para o próximo da fila, sem voltar a ficar livre. */
  private release(): void {
    const next = this.waiters.shift();
    if (next) next();
    else this.active -= 1;
  }
}
