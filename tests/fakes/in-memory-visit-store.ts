import { usernameKey } from '../../src/domain/username.js';
import type { Visit, VisitStore } from '../../src/storage/visit-store.js';

/** Visitas em memória, com a mesma deduplicação da chave primária do SQLite. */
export class InMemoryVisitStore implements VisitStore {
  readonly rows = new Map<string, Visit>();

  record(visit: Visit): void {
    const key = `${usernameKey(visit.username)}|${visit.day}|${visit.visitor}`;
    if (!this.rows.has(key)) this.rows.set(key, visit);
  }

  countSince(day: string): number {
    return [...this.rows.values()].filter((visit) => visit.day >= day).length;
  }

  topSince(day: string, limit: number): string[] {
    const counts = new Map<string, { username: string; total: number }>();
    for (const visit of this.rows.values()) {
      if (visit.day < day) continue;
      const entry = counts.get(usernameKey(visit.username)) ?? {
        username: visit.username,
        total: 0,
      };
      counts.set(usernameKey(visit.username), { ...entry, total: entry.total + 1 });
    }
    return [...counts.values()]
      .sort((a, b) => b.total - a.total || a.username.localeCompare(b.username))
      .slice(0, limit)
      .map((entry) => entry.username);
  }

  purgeBefore(day: string): void {
    for (const [key, visit] of this.rows) if (visit.day < day) this.rows.delete(key);
  }
}
