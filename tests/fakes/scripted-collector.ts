import type { CollectedProfile } from '../../src/domain/types.js';
import type { ProfileCollector, ProgressListener } from '../../src/github/collector.js';

/** Coletor roteirizado: devolve perfis configurados ou lança o erro configurado. */
export class ScriptedCollector implements ProfileCollector {
  readonly profiles = new Map<string, CollectedProfile>();
  failure: Error | null = null;
  calls = 0;
  private gate: Promise<void> = Promise.resolve();
  private release: () => void = () => {};

  /** Segura as coletas até `open()`, para testar chamadas concorrentes. */
  hold(): void {
    this.gate = new Promise((resolve) => (this.release = resolve));
  }

  open(): void {
    this.release();
  }

  async collect(
    login: string,
    onProgress: ProgressListener = () => {},
  ): Promise<CollectedProfile | null> {
    this.calls += 1;
    await this.gate;
    if (this.failure) throw this.failure;
    const profile = this.profiles.get(login.toLowerCase()) ?? null;
    if (profile) onProgress({ stage: 'perfil', account: profile.account });
    return profile;
  }
}
