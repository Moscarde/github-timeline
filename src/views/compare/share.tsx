import { viewText, viewMessage } from '../../i18n/view.js';
import type { FC } from 'hono/jsx';
import { comparePath, type ComparisonBlocker } from '../../domain/compare.js';
import type { ProfileSnapshot } from '../../domain/snapshot.js';
import { CompareForm } from '../compare-form.js';
import { ProfileHeader } from '../profile/header.js';
import type { CompareShareLinks } from '../share-links.js';

/**
 * "Copiar link" da comparação: a URL do par, não a de um dos perfis. Rótulo só em texto,
 * porque `app.js` restaura o `textContent` depois de "Link copiado ✓".
 */
export const CopyCompareLink: FC<{ url: string }> = ({ url }) => (
  <button
    class="btn-p"
    type="button"
    data-copy-text={url}
    data-copied-label={viewText('Link copiado ✓')}
    aria-label={viewText('Copiar link da comparação')}
  >
    {viewText('Copiar link')}
  </button>
);

/** Topbar da comparação: inverter os lados e copiar o link do par. */
export const CompareTopActions: FC<{ a: string; b: string; url: string }> = ({ a, b, url }) => (
  <>
    <a
      class="btn"
      href={comparePath(b, a)}
      aria-label={viewMessage('Inverter: {0} vs {1}', [b, a])}
    >
      ⇄<span class="desktop-only">{viewText(' Inverter')}</span>
    </a>
    <CopyCompareLink url={url} />
  </>
);

/** Chamada final: link do par, redes e um formulário para trocar os perfis. */
export const CompareShare: FC<{ share: CompareShareLinks; a: string; b: string }> = (props) => (
  <section class="share-cta wrap" aria-labelledby="compartilhar">
    <div class="share-cta-box compare-share">
      <h2 id="compartilhar">{viewText('Compartilhe o duelo')}</h2>
      <div class="share-cta-row">
        <span class="mono url-box">{props.share.page.replace(/^https?:\/\//, '')}</span>
        <CopyCompareLink url={props.share.page} />
        <a class="btn" href={props.share.x} target="_blank" rel="noopener">
          X
        </a>
        <a class="btn" href={props.share.linkedin} target="_blank" rel="noopener">
          LinkedIn
        </a>
      </div>
      <CompareForm lead={viewText('Trocar perfis:')} a={props.a} b={props.b} />
    </div>
  </section>
);

const BLOCKER_TEXT: Record<ComparisonBlocker, (username: string) => string> = {
  organizacao: (username) =>
    viewMessage('@{0} é uma organização. Comparações contam a trajetória de duas pessoas.', [
      username,
    ]),
  vazio: (username) =>
    viewMessage('@{0} ainda não tem repositórios públicos, então não há trajetória.', [username]),
};

/** Um dos lados não tem trajetória (§6): explica e oferece os caminhos possíveis. */
export const NotComparable: FC<{
  blocked: ProfileSnapshot;
  reason: ComparisonBlocker;
  other: ProfileSnapshot;
}> = ({ blocked, reason, other }) => (
  <section class="state-card wrap">
    <ProfileHeader account={blocked.account} />
    <p class="state-title">
      {viewText('Essa dupla ')}
      <span class="ink">{viewText('não dá pra comparar.')}</span>
    </p>
    <p class="muted state-text">{BLOCKER_TEXT[reason](blocked.account.username)}</p>
    <div class="state-actions">
      <a class="btn" href={`/u/${encodeURIComponent(blocked.account.username)}`}>
        {viewText('Ver @')}
        {blocked.account.username}
      </a>
      <a class="btn" href={`/u/${encodeURIComponent(other.account.username)}`}>
        {viewText('Ver @')}
        {other.account.username}
      </a>
    </div>
    <CompareForm lead={viewText('Comparar com outro perfil:')} a={other.account.username} lockA />
  </section>
);
