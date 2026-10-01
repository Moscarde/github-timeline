import type { FC } from 'hono/jsx';
import type { ShareLinks } from '../share-links.js';

/** Chamada final para compartilhar: URL canônica e badge copiáveis. */
export const ShareCta: FC<{ share: ShareLinks }> = ({ share }) => (
  <section class="share-cta" aria-labelledby="compartilhar">
    <h2 id="compartilhar">Compartilhe esta timeline</h2>
    <CopyField id="url-perfil" label="Link" value={share.page} />
    <div class="badge-preview">
      <img src={share.badge} alt="Badge da Timeline" height="28" />
    </div>
    <CopyField id="badge-md" label="Badge para README" value={share.badgeMarkdown} />
  </section>
);

/** Campo somente leitura com botão de copiar; sem JS, o texto continua selecionável. */
export const CopyField: FC<{ id: string; label: string; value: string }> = ({
  id,
  label,
  value,
}) => (
  <div class="copy-field">
    <label for={id}>{label}</label>
    <div class="copy-row">
      <input id={id} class="mono" value={value} readonly />
      <button class="btn" type="button" data-copy={id}>
        Copiar
      </button>
    </div>
  </div>
);
