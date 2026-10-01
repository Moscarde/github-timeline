import { usernameKey } from '../../src/domain/username.js';
import type { ProfileSnapshot } from '../../src/domain/snapshot.js';
import type { SnapshotStore, StoredSnapshot } from '../../src/storage/snapshot-store.js';

/** Snapshots em memória, para testes de serviço e rotas. */
export class InMemorySnapshotStore implements SnapshotStore {
  readonly rows = new Map<string, StoredSnapshot>();

  find(username: string): StoredSnapshot | null {
    return this.rows.get(usernameKey(username)) ?? null;
  }

  save(snapshot: ProfileSnapshot, expiresAt: Date): void {
    this.rows.set(usernameKey(snapshot.account.username), { snapshot, expiresAt });
  }
}
