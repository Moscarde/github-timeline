/** Pontos GraphQL restantes, conforme o último `rateLimit` devolvido pela API. */
export interface QuotaReading {
  limit: number;
  remaining: number;
  resetAt: string;
}

/**
 * Guarda a última leitura de cota do token do servidor (§8, "Cota").
 * @example quota.isLow() // true abaixo de 10% dos pontos
 */
export class QuotaTracker {
  private reading: QuotaReading | null = null;

  constructor(private readonly lowRatio = 0.1) {}

  record(reading: QuotaReading): void {
    this.reading = reading;
  }

  current(): QuotaReading | null {
    return this.reading;
  }

  /** Abaixo do limite, o servidor só serve snapshots e enfileira coletas novas. */
  isLow(): boolean {
    if (!this.reading || this.reading.limit === 0) return false;
    return this.reading.remaining / this.reading.limit < this.lowRatio;
  }
}
