import type Database from 'better-sqlite3';
import { usernameKey } from '../domain/username.js';
import type { ProfileSnapshot } from '../domain/snapshot.js';

/** Snapshot salvo e o instante em que deixa de estar fresco. */
export interface StoredSnapshot {
  snapshot: ProfileSnapshot;
  expiresAt: Date;
}

/** Persistência dos snapshots derivados (§3). */
export interface SnapshotStore {
  find(username: string): StoredSnapshot | null;
  save(snapshot: ProfileSnapshot, expiresAt: Date): void;
}

interface SnapshotRow {
  payload: string;
  expires_at: string;
}

/**
 * Snapshots em SQLite, indexados pelo username em minúsculas.
 * @example const store = new SqliteSnapshotStore(openDatabase('timeline.db'));
 */
export class SqliteSnapshotStore implements SnapshotStore {
  constructor(private readonly db: Database.Database) {}

  find(username: string): StoredSnapshot | null {
    const row = this.db
      .prepare('SELECT payload, expires_at FROM snapshots WHERE username_key = ?')
      .get(usernameKey(username)) as SnapshotRow | undefined;
    if (!row) return null;
    return {
      snapshot: JSON.parse(row.payload) as ProfileSnapshot,
      expiresAt: new Date(row.expires_at),
    };
  }

  save(snapshot: ProfileSnapshot, expiresAt: Date): void {
    this.db
      .prepare(
        `INSERT INTO snapshots (username_key, username, version, payload, generated_at, expires_at)
         VALUES (@key, @username, @version, @payload, @generatedAt, @expiresAt)
         ON CONFLICT(username_key) DO UPDATE SET username = excluded.username, version = excluded.version,
           payload = excluded.payload, generated_at = excluded.generated_at, expires_at = excluded.expires_at`,
      )
      .run({
        key: usernameKey(snapshot.account.username),
        username: snapshot.account.username,
        version: snapshot.version,
        payload: JSON.stringify(snapshot),
        generatedAt: snapshot.generatedAt,
        expiresAt: expiresAt.toISOString(),
      });
  }
}
