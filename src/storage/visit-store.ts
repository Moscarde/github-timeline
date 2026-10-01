import type Database from 'better-sqlite3';
import { usernameKey } from '../domain/username.js';

/** Visita a uma timeline: username, dia UTC (AAAA-MM-DD) e hash diário do visitante. */
export interface Visit {
  username: string;
  day: string;
  visitor: string;
}

/** Eventos de visita (§8, "Privacidade"): nunca guarda o IP bruto. */
export interface VisitStore {
  /** Idempotente: o mesmo visitante conta uma vez por username e dia. */
  record(visit: Visit): void;
  /** Visitas a partir do dia informado, inclusive. */
  countSince(day: string): number;
  /** Usernames mais visitados a partir do dia informado, do maior para o menor. */
  topSince(day: string, limit: number): string[];
  /** Apaga visitas anteriores ao dia informado (retenção de 30 dias). */
  purgeBefore(day: string): void;
}

/**
 * Visitas em SQLite, deduplicadas pela chave primária (username, dia, visitante).
 * @example new SqliteVisitStore(db).topSince('2026-09-23', 6)
 */
export class SqliteVisitStore implements VisitStore {
  constructor(private readonly db: Database.Database) {}

  record(visit: Visit): void {
    this.db
      .prepare(
        `INSERT OR IGNORE INTO visits (username_key, username, day, visitor)
         VALUES (@key, @username, @day, @visitor)`,
      )
      .run({ key: usernameKey(visit.username), ...visit });
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
