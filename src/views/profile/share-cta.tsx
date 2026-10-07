import { viewText } from '../../i18n/view.js';
import type { FC } from 'hono/jsx';
import type { ProfileStats } from '../../domain/snapshot.js';
import { BadgePreview } from '../badge-preview.js';
import { badgeValue } from '../../brand/badge.js';
import type { ShareLinks } from '../share-links.js';

/** Chamada final "Mostre sua trajetória": link canônico copiável e prévia do badge. */
export const ShareCta: FC<{ share: ShareLinks; stats: ProfileStats }> = ({ share, stats }) => (
  <section class="share-cta wrap" aria-labelledby="compartilhar">
    <div class="share-cta-box">
      <div class="share-cta-copy">
        <h2 id="compartilhar">{viewText('Mostre sua trajetória')}</h2>
        <p class="muted">
          {viewText('Card pronto para redes, no tema que você está usando, e badge para o README.')}
        </p>
        <div class="share-cta-row">
          <span class="mono url-box" data-share-url>
            {share.page.replace(/^https?:\/\//, '').replace(/\?.*$/, '')}
          </span>
          <CopyLinkButton url={share.page} />
          <button class="btn" type="button" data-copy-text={share.badgeMarkdown}>
            {viewText('Copiar badge')}
          </button>
        </div>
      </div>
      <BadgePreview value={badgeValue(stats)} />
    </div>
  </section>
);

/** "Copiar link": copia a URL com o tema ativo; o rótulo vira "Link copiado ✓". */
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
