export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogFields = Record<string, unknown>;

/** Logger estruturado: cada linha é um objeto JSON (§8, "Observabilidade"). */
export interface Logger {
  log(level: LogLevel, event: string, fields?: LogFields): void;
}

/**
 * Escreve JSON por linha num destino injetado (stdout por padrão).
 * @example new JsonLogger().log('info', 'collection.done', { username, ms: 812 })
 */
export class JsonLogger implements Logger {
  constructor(
    private readonly write: (line: string) => void = (line) => process.stdout.write(`${line}\n`),
    private readonly now: () => Date = () => new Date(),
  ) {}

  log(level: LogLevel, event: string, fields: LogFields = {}): void {
    this.write(JSON.stringify({ time: this.now().toISOString(), level, event, ...fields }));
  }
}
