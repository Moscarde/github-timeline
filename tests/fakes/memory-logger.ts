import type { LogFields, Logger, LogLevel } from '../../src/lib/logger.js';

/** Logger que guarda as entradas para inspeção nos testes. */
export class MemoryLogger implements Logger {
  readonly entries: Array<{ level: LogLevel; event: string; fields: LogFields }> = [];

  log(level: LogLevel, event: string, fields: LogFields = {}): void {
    this.entries.push({ level, event, fields });
  }

  events(): string[] {
    return this.entries.map((entry) => entry.event);
  }
}
