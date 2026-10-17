import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { openDatabase } from '../../src/storage/database.js';
import { SqliteVisitStore } from '../../src/storage/visit-store.js';

/** Real SQLite fixture to verify upgrade and restart behavior against a production-era schema. */
function legacyDatabase(path: string): void {
  const db = openDatabase(path);
  db.exec('DROP TABLE timeline_daily; DROP TABLE event_daily');
  db.pragma('user_version = 8');
  db.prepare('INSERT INTO visits (username_key, username, day, visitor) VALUES (?, ?, ?, ?)').run(
    'dev',
    'Dev',
    '2026-09-01',
    'legacy-hash',
  );
  db.close();
}

describe('visit statistics migration', () => {
  it('seeds available history once and preserves totals and events across purges and restarts', () => {
    const directory = mkdtempSync(join(tmpdir(), 'timeline-migration-'));
    try {
      const path = join(directory, 'timeline.sqlite');
      legacyDatabase(path);
      const db = openDatabase(path);
      const store = new SqliteVisitStore(db);
      expect(store.totalCount()).toBe(1);
      store.record({ username: 'dev', day: '2026-09-01', visitor: 'legacy-hash' });
      store.recordEvent({ day: '2026-10-17', event: 'landing', status: 200, locale: 'en' });
      store.purgeBefore('2026-10-01');
      db.close();
      const reopened = openDatabase(path);
      expect(new SqliteVisitStore(reopened).totalCount()).toBe(2);
      expect(new SqliteVisitStore(reopened).countSince('2000-01-01')).toBe(0);
      expect(reopened.prepare('SELECT total FROM event_daily').get()).toEqual({ total: 1 });
      reopened.close();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
