import type { FC } from 'hono/jsx';
import { formatMonthYear } from '../../domain/format.js';
import type { GithubAccount } from '../../domain/types.js';
import { avatarUrl } from '../../lib/avatar.js';
import type { ShareLinks } from '../share-links.js';

/** Cabeçalho do perfil; também usado no estado "coletando", assim que `/users` responde. */
export const ProfileHeader: FC<{ account: GithubAccount; share?: ShareLinks }> = ({
  account,
  share,
}) => {
  const isOrg = account.type === 'Organization';
  return (
    <div class="profile-head">
      <img
        class={isOrg ? 'avatar org' : 'avatar'}
        src={avatarUrl(account.avatarUrl, 144)}
        alt=""
        width="72"
        height="72"
      />
      <div class="who">
        <div class="who-name">{account.name || account.username}</div>
        <div class="mono muted who-username">
          <a href={account.htmlUrl} rel="noopener">
            @{account.username}
          </a>{' '}
          · {isOrg ? 'organização' : `no GitHub desde ${formatMonthYear(account.createdAt)}`}
        </div>
      </div>
      {share && <ShareActions share={share} placement="desktop-only" />}
    </div>
  );
};

/**
 * "Compartilhar no X", "LinkedIn" e "Baixar card". No celular o bloco desce para depois das
 * linguagens (M2), então a página o renderiza nas duas posições e o CSS escolhe uma.
 */
export const ShareActions: FC<{ share: ShareLinks; placement: 'desktop-only' | 'mobile-only' }> = ({
  share,
  placement,
}) => (
  <div class={`share-actions ${placement}`} data-share-actions>
    <a class="btn" href={share.x} data-share="x" target="_blank" rel="noopener">
      <span class="desktop-only">Compartilhar no </span>X
    </a>
    <a class="btn" href={share.linkedin} data-share="linkedin" target="_blank" rel="noopener">
      LinkedIn
    </a>
    <a class="btn" href={share.card} data-share="card" download>
      Baixar card
    </a>
  </div>
);
