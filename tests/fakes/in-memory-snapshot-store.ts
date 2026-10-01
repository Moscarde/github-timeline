import { loginKey } from '../../src/domain/login.js';
import type { ProfileSnapshot } from '../../src/domain/snapshot.js';
import type { SnapshotStore, StoredSnapshot } from '../../src/storage/snapshot-store.js';

/** Snapshots em memória, para testes de serviço e rotas. */
export class InMemorySnapshotStore implements SnapshotStore {
  readonly rows = new Map<string, StoredSnapshot>();

  find(login: string): StoredSnapshot | null {
    return this.rows.get(loginKey(login)) ?? null;
  }

  save(snapshot: ProfileSnapshot, expiresAt: Date): void {
    this.rows.set(loginKey(snapshot.account.login), { snapshot, expiresAt });
  }
}
