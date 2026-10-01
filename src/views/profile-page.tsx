import type { FC } from 'hono/jsx';
import { CANONICAL_ORIGIN } from '../config.js';
import type { ProfileSnapshot } from '../domain/snapshot.js';
import type { Theme, ThemePreference } from '../lib/theme.js';
import { Layout, type PageMeta } from './layout.js';
import { Achievements } from './profile/achievements.js';
import { ProfileHeader } from './profile/header.js';
import { ShareCta } from './profile/share-cta.js';
import { Summary } from './profile/summary.js';
import { Timeline } from './profile/timeline.js';
import { shareLinks } from './share-links.js';
import { EmptyHistory, OrganizationNotice } from './states.js';

export interface ProfilePageProps {
  snapshot: ProfileSnapshot;
  theme: ThemePreference;
  /** Tema do card e dos links de compartilhamento; o padrão é escuro (§5.1). */
  shareTheme: Theme;
}

/**
 * Meta tags do perfil; `og:image` usa o mesmo tema da URL compartilhada.
 * @example profileMeta(snapshot, 'claro').imageUrl
 */
export function profileMeta(snapshot: ProfileSnapshot, shareTheme: Theme): PageMeta {
  const { login, name } = snapshot.account;
  const path = `/u/${encodeURIComponent(login)}`;
  return {
    title: `${name || login} · Timeline`,
    description: snapshot.headline.full,
    canonicalUrl: `${CANONICAL_ORIGIN}${path}`,
    imageUrl: `${CANONICAL_ORIGIN}${path}/card.png?tema=${shareTheme}&v=${encodeURIComponent(snapshot.generatedAt)}`,
  };
}

/** Página `/u/<login>` (§2.2). */
export const ProfilePage: FC<ProfilePageProps> = ({ snapshot, theme, shareTheme }) => {
  const share = shareLinks(snapshot.account.login, shareTheme, snapshot.headline.full);
  return (
    <Layout
      meta={profileMeta(snapshot, shareTheme)}
      theme={theme}
      topbarActions={<CopyLinkButton url={share.page} />}
    >
      <ProfileHeader account={snapshot.account} share={share} />
      <ProfileBody snapshot={snapshot} />
      <ShareCta share={share} />
    </Layout>
  );
};

const ProfileBody: FC<{ snapshot: ProfileSnapshot }> = ({ snapshot }) => {
  if (snapshot.account.type === 'Organization')
    return <OrganizationNotice login={snapshot.account.login} />;
  if (!snapshot.stats.repos) return <EmptyHistory login={snapshot.account.login} />;
  return (
    <>
      <Summary snapshot={snapshot} />
      <Achievements achievements={snapshot.achievements} />
      <Timeline eras={snapshot.timeline} months={snapshot.months} />
    </>
  );
};

const CopyLinkButton: FC<{ url: string }> = ({ url }) => (
  <button class="btn" type="button" data-copy-text={url} data-share-link>
    Copiar link
  </button>
);
