import { viewText } from '../../i18n/view.js';
import type { FC } from 'hono/jsx';

/**
 * "Copiar link": copia a URL com o tema ativo; o rótulo vira "Link copiado ✓".
 * @example <CopyLinkButton url={share.page} />
 */
export const CopyLinkButton: FC<{ url: string }> = ({ url }) => (
  <button
    class="btn-p"
    type="button"
    data-copy-text={url}
    data-share-link
    data-copied-label={viewText('Link copiado ✓')}
  >
    {viewText('Copiar link')}
  </button>
);
