import Database from 'better-sqlite3';

const MIGRATIONS: string[] = [
  `CREATE TABLE IF NOT EXISTS snapshots (
     login_key    TEXT PRIMARY KEY,
     login        TEXT NOT NULL,
     version      INTEGER NOT NULL,
     payload      TEXT NOT NULL,
     generated_at TEXT NOT NULL,
     expires_at   TEXT NOT NULL
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
