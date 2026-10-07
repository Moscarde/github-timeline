import { useLocale } from '../i18n/view.js';
import type { Locale } from '../i18n/locale.js';
import { viewText } from '../i18n/view.js';
import type { FC } from 'hono/jsx';
import { CANONICAL_ORIGIN } from '../config.js';
import type { ProfileSnapshot } from '../domain/snapshot.js';
import type { Theme, ThemePreference } from '../lib/theme.js';
import { Layout, type PageMeta } from './layout.js';
import { Achievements } from './profile/achievements.js';
import { CompareForm } from './compare-form.js';
import { ProfileHeader, ShareActions } from './profile/header.js';
import { CopyLinkButton, ShareCta } from './profile/share-cta.js';
import { Summary } from './profile/summary.js';
import { Timeline } from './profile/timeline.js';
import { shareLinks, type ShareLinks } from './share-links.js';
import {
  EmptyHistory,
  OrganizationPeople,
  StaleBanner,
  type StaleNotice,
} from './states/profile-states.js';

export interface ProfilePageProps {
  snapshot: ProfileSnapshot;
  theme: ThemePreference;
  /** Tema do card e dos links de compartilhamento; o padrão é escuro (§5.1). */
  shareTheme: Theme;
  /** Aviso de snapshot antigo enquanto a cota está esgotada (§6). */
  stale?: StaleNotice;
}

/**
 * Meta tags do perfil; `og:image` usa o mesmo tema da URL compartilhada.
 * @example profileMeta(snapshot, 'claro').imageUrl
 */
export function profileMeta(
  snapshot: ProfileSnapshot,
  shareTheme: Theme,
  locale?: Locale,
): PageMeta {
  const { username, name } = snapshot.account;
  const path = `/u/${encodeURIComponent(username)}`;
  return {
    title: `${name || username} · GitHub Timeline`,
    description: snapshot.headline.full,
    canonicalUrl: `${CANONICAL_ORIGIN}${path}`,
    imageUrl: `${CANONICAL_ORIGIN}${path}/card.png?tema=${shareTheme}${locale ? `&lang=${locale}` : ''}&v=${encodeURIComponent(snapshot.generatedAt)}`,
  };
}

/** Página `/u/<username>` (§2.2); a comparação tem página própria (`compare-page.tsx`). */
export const ProfilePage: FC<ProfilePageProps> = (props) => {
  const { snapshot } = props;
  const share = shareLinks(
    snapshot.account.username,
    props.shareTheme,
    snapshot.headline.full,
    useLocale(),
  );
  return (
    <Layout
      meta={profileMeta(snapshot, props.shareTheme, useLocale())}
      theme={props.theme}
      topbar={{
        owner: snapshot.account,
        actions: <CopyLinkButton url={share.page} />,
      }}
    >
      {props.stale && <StaleBanner notice={props.stale} />}
      <ProfileBody {...props} share={share} />
    </Layout>
  );
};

const ProfileBody: FC<ProfilePageProps & { share: ShareLinks }> = (props) => {
  const { snapshot, share } = props;
  if (snapshot.account.type === 'Organization') return <OrganizationPeople snapshot={snapshot} />;
  if (!snapshot.stats.repos) return <EmptyHistory snapshot={snapshot} />;
  return (
    <>
      <section class="profile-hero">
        <div class="wrap">
          <ProfileHeader account={snapshot.account} share={share} />
          <Summary snapshot={snapshot} />
          <ShareActions share={share} placement="mobile-only" />
          <CompareForm
            lead={viewText('Comparar com outro perfil:')}
            a={snapshot.account.username}
            lockA
          />
        </div>
      </section>
      <Achievements achievements={snapshot.achievements} />
      <Timeline eras={snapshot.timeline} months={snapshot.months} />
      <ShareCta share={share} stats={snapshot.stats} />
    </>
  );
};
