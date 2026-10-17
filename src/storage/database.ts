import Database from 'better-sqlite3';

/** Em ordem de aplicação; nunca altere uma já publicada, acrescente outra. */
const MIGRATIONS: string[] = [
  `CREATE TABLE IF NOT EXISTS snapshots (
     login_key    TEXT PRIMARY KEY,
     login        TEXT NOT NULL,
     version      INTEGER NOT NULL,
     payload      TEXT NOT NULL,
     generated_at TEXT NOT NULL,
     expires_at   TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS visits (
     login_key TEXT NOT NULL,
     login     TEXT NOT NULL,
     day       TEXT NOT NULL,
     visitor   TEXT NOT NULL,
     PRIMARY KEY (login_key, day, visitor)
   )`,
  `CREATE INDEX IF NOT EXISTS visits_day ON visits (day)`,
  // "login" passou a se chamar "username" (no código e no payload): os snapshots antigos
  // guardam `account.login`, então são descartados e recoletados na próxima visita.
  `DELETE FROM snapshots`,
  `ALTER TABLE snapshots RENAME COLUMN login_key TO username_key`,
  `ALTER TABLE snapshots RENAME COLUMN login TO username`,
  `ALTER TABLE visits RENAME COLUMN login_key TO username_key`,
  `ALTER TABLE visits RENAME COLUMN login TO username`,
  `CREATE TABLE timeline_daily (
     day TEXT NOT NULL,
     username_key TEXT NOT NULL,
     total INTEGER NOT NULL,
     PRIMARY KEY (day, username_key)
   )`,
  `INSERT INTO timeline_daily (day, username_key, total)
   SELECT day, username_key, COUNT(*) FROM visits GROUP BY day, username_key`,
  `CREATE TABLE event_daily (
     day TEXT NOT NULL,
     event TEXT NOT NULL,
     status INTEGER NOT NULL,
     locale TEXT NOT NULL,
     total INTEGER NOT NULL,
     PRIMARY KEY (day, event, status, locale)
   )`,
];

/**
 * Abre o SQLite em modo WAL e aplica as migrações pendentes.
 * @example const db = openDatabase(':memory:');
 */
export function openDatabase(path: string): Database.Database {
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  migrate(db);
  return db;
}

function migrate(db: Database.Database): void {
  const applied = db.pragma('user_version', { simple: true }) as number;
  for (const [index, statement] of MIGRATIONS.entries()) {
    if (index < applied) continue;
    db.exec(statement);
    db.pragma(`user_version = ${index + 1}`);
  }
}
