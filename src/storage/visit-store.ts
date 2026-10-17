import type Database from 'better-sqlite3';
import { usernameKey } from '../domain/username.js';

/** Visita a uma timeline: username, dia UTC (AAAA-MM-DD) e hash diário do visitante. */
export interface Visit {
  username: string;
  day: string;
  visitor: string;
}

/** Agregado HTTP sem IP, query string ou identificador de visitante. */
export interface UsageEvent {
  day: string;
  event: string;
  status: number;
  locale: string;
}

/** Eventos de visita (§8, "Privacidade"): nunca guarda o IP bruto. */
export interface VisitStore {
  /** Conta cada abertura; visitantes distintos ficam separados para o ranking. */
  record(visit: Visit): void;
  /** Total acumulado de aberturas, inclusive após a retenção dos hashes. */
  totalCount(): number;
  /** Incrementa o agregado diário de um evento HTTP. */
  recordEvent(event: UsageEvent): void;
  /** Visitantes distintos por perfil/dia a partir do dia informado, inclusive. */
  countSince(day: string): number;
  /** Usernames mais visitados a partir do dia informado, do maior para o menor. */
  topSince(day: string, limit: number): string[];
  /** Apaga visitas anteriores ao dia informado (retenção de 30 dias). */
  purgeBefore(day: string): void;
}

/**
 * Aberturas acumuladas em SQLite e visitantes deduplicados para "Em alta".
 * @example new SqliteVisitStore(db).topSince('2026-09-23', 6)
 */
export class SqliteVisitStore implements VisitStore {
  constructor(private readonly db: Database.Database) {}

  record(visit: Visit): void {
    this.db.transaction(() => {
      this.db
        .prepare(
          `INSERT OR IGNORE INTO visits (username_key, username, day, visitor)
         VALUES (@key, @username, @day, @visitor)`,
        )
        .run({ key: usernameKey(visit.username), ...visit });
      this.db
        .prepare(
          `INSERT INTO timeline_daily (day, username_key, total) VALUES (?, ?, 1)
         ON CONFLICT (day, username_key) DO UPDATE SET total = total + 1`,
        )
        .run(visit.day, usernameKey(visit.username));
    })();
  }

  totalCount(): number {
    const row = this.db
      .prepare('SELECT COALESCE(SUM(total), 0) AS total FROM timeline_daily')
      .get() as { total: number };
    return row.total;
  }

  recordEvent(event: UsageEvent): void {
    this.db
      .prepare(
        `INSERT INTO event_daily (day, event, status, locale, total)
       VALUES (@day, @event, @status, @locale, 1)
       ON CONFLICT (day, event, status, locale) DO UPDATE SET total = total + 1`,
      )
      .run(event);
  }

  countSince(day: string): number {
    const row = this.db.prepare('SELECT COUNT(*) AS total FROM visits WHERE day >= ?').get(day) as {
      total: number;
    };
    return row.total;
  }

  topSince(day: string, limit: number): string[] {
    const rows = this.db
      .prepare(
        `SELECT MAX(username) AS username, COUNT(*) AS total FROM visits WHERE day >= ?
         GROUP BY username_key ORDER BY total DESC, username_key ASC LIMIT ?`,
      )
      .all(day, limit) as Array<{ username: string }>;
    return rows.map((row) => row.username);
  }

  purgeBefore(day: string): void {
    this.db.prepare('DELETE FROM visits WHERE day < ?').run(day);
  }
}
