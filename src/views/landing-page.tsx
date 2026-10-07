import { viewText } from '../i18n/view.js';
import type { FC } from 'hono/jsx';
import { CANONICAL_ORIGIN } from '../config.js';
import type { ThemePreference } from '../lib/theme.js';
import type { GalleryTab } from '../services/gallery-service.js';
import { BadgeSection } from './landing/badge-section.js';
import { Gallery } from './landing/gallery.js';
import { Hero } from './landing/hero.js';
import { Layout } from './layout.js';

export interface LandingPageProps {
  theme: ThemePreference;
  tabs: GalleryTab[];
  weeklyCount: number;
  projectStars: number | null;
  error?: string;
}

/** Landing (§2.1): hero, galeria e badge. */
export const LandingPage: FC<LandingPageProps> = (props) => (
  <Layout
    theme={props.theme}
    topbar={{ landing: { stars: props.projectStars } }}
    meta={{
      title: viewText('GitHub Timeline · todo commit conta uma história'),
      description: viewText(
        'Digite um usuário do GitHub e veja a trajetória ano a ano: linguagens, topics, stars e marcos dos repositórios públicos.',
      ),
      canonicalUrl: `${CANONICAL_ORIGIN}/`,
    }}
  >
    <Hero weeklyCount={props.weeklyCount} error={props.error} />
    <Gallery tabs={props.tabs} />
    <BadgeSection />
  </Layout>
);
