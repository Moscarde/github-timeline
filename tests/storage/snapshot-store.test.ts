import { describe, expect, it } from 'vitest';
import { deriveSnapshot } from '../../src/domain/snapshot.js';
import { openDatabase } from '../../src/storage/database.js';
import { SqliteSnapshotStore } from '../../src/storage/snapshot-store.js';
import { makeAccount, repoIn } from '../fakes/repo-factory.js';

const snapshotFor = (login: string) =>
  deriveSnapshot(
    {
      account: makeAccount({ login }),
      repos: [repoIn(2020, { language: 'Go' })],
      months: {},
      orgContributions: [],
    },
    new Date('2026-01-01T00:00:00Z'),
  );

describe('SqliteSnapshotStore', () => {
  it('salva, encontra sem diferenciar maiúsculas e sobrescreve', () => {
    const store = new SqliteSnapshotStore(openDatabase(':memory:'));
    const expiresAt = new Date('2026-01-01T12:00:00Z');
    store.save(snapshotFor('TeoCalvo'), expiresAt);
    store.save(snapshotFor('TeoCalvo'), new Date('2026-01-02T00:00:00Z'));
    const found = store.find('teocalvo');
    expect(found?.snapshot.account.login).toBe('TeoCalvo');
    expect(found?.expiresAt.toISOString()).toBe('2026-01-02T00:00:00.000Z');
    expect(store.find('ghost')).toBeNull();
  });

  it('aplica migrações de forma idempotente', () => {
    const db = openDatabase(':memory:');
    expect(db.pragma('user_version', { simple: true })).toBe(1);
  });
});
