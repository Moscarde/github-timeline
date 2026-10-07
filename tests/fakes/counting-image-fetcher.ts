import type { ImageFetcher } from '../../src/card/card-renderer.js';

/** Named image dependency to observe cache behavior without network calls. */
export class CountingImageFetcher {
  calls = 0;

  readonly fetch: ImageFetcher = async () => {
    this.calls += 1;
    return null;
  };
}
