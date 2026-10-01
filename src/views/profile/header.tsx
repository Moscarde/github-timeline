import type { FC } from 'hono/jsx';
import { formatMonthYear } from '../../domain/format.js';
import type { GithubAccount } from '../../domain/types.js';
import { avatarUrl } from '../../lib/avatar.js';
import type { ShareLinks } from '../share-links.js';

/** Cabeçalho do perfil; também usado no estado "coletando", assim que `/users` responde. */
export const ProfileHeader: FC<{ account: GithubAccount; share?: ShareLinks }> = ({
  account,
  share,
}) => (
  <section class="profile-head">
    <img class="avatar" src={avatarUrl(account.avatarUrl, 176)} alt="" width="88" height="88" />
    <div class="who">
      <h1>{account.name || account.login}</h1>
      <p class="login mono">
        <a href={account.htmlUrl} rel="noopener">
          @{account.login}
        </a>{' '}
        · no GitHub desde {formatMonthYear(account.createdAt)}
      </p>
      {account.bio && <p class="bio">{account.bio}</p>}
    </div>
    {share && <ShareActions share={share} />}
  </section>
);

const ShareActions: FC<{ share: ShareLinks }> = ({ share }) => (
  <div class="share-actions" data-share-actions>
    <a class="btn" href={share.x} data-share="x" target="_blank" rel="noopener">
      Compartilhar no X
    </a>
    <a class="btn" href={share.linkedin} data-share="linkedin" target="_blank" rel="noopener">
      LinkedIn
    </a>
    <a class="btn primary" href={share.card} data-share="card" download>
      Baixar card
    </a>
  </div>
);
