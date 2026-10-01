import type { CardRenderer } from '../../src/card/card-renderer.js';
import type { CardVariant } from '../../src/card/card-layout.js';
import type { ProfileSnapshot } from '../../src/domain/snapshot.js';
import type { Theme } from '../../src/lib/theme.js';

/** Renderer de card que registra as chamadas e devolve um PNG mínimo. */
export class RecordingCardRenderer implements CardRenderer {
  readonly calls: Array<{ username: string; theme: Theme; variant: CardVariant }> = [];

  async render(
    snapshot: ProfileSnapshot,
    theme: Theme,
    variant: CardVariant,
  ): Promise<Uint8Array<ArrayBuffer>> {
    this.calls.push({ username: snapshot.account.username, theme, variant });
    return new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
  }
}
