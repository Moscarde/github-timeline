import type { FC } from 'hono/jsx';
import { CANONICAL_ORIGIN } from '../config.js';
import { comparePath, comparisonBlocker } from '../domain/compare.js';
import type { ProfileSnapshot } from '../domain/snapshot.js';
import type { ThemePreference } from '../lib/theme.js';
import { Duel } from './compare/duel.js';
import { AchievementDuel, Languages, Numbers } from './compare/numbers.js';
import { CompareShare, CompareTopActions, NotComparable } from './compare/share.js';
import { YearByYear } from './compare/years.js';
import { Layout, type PageMeta } from './layout.js';
import { compareShareLinks } from './share-links.js';
import { StaleBanner, type StaleNotice } from './states/profile-states.js';

export interface ComparePageProps {
  a: ProfileSnapshot;
  b: ProfileSnapshot;
  theme: ThemePreference;
  /** Aviso de snapshot antigo de qualquer um dos lados enquanto a cota está esgotada (§6). */
  stale?: StaleNotice;
}

type Pair = { a: ProfileSnapshot; b: ProfileSnapshot };

/**
 * Meta tags do par. Fica fora do índice: cada par é uma página nova e o conteúdo repete os
 * perfis, que já são indexáveis.
 * @example compareMeta(a, b).title // "torvalds vs gaearon · GitHub Timeline"
 */
export function compareMeta(a: ProfileSnapshot, b: ProfileSnapshot): PageMeta {
  const [left, right] = [a.account.username, b.account.username];
  return {
    title: `${left} vs ${right} · GitHub Timeline`,
    description: `Duas trajetórias no GitHub, ano a ano: @${left} e @${right}.`,
    canonicalUrl: `${CANONICAL_ORIGIN}${comparePath(left, right)}`,
    noindex: true,
  };
}

/**
 * Página `/u/<a>...<b>` (§2.4): sobre o par, sem dono. Os dois perfis têm o mesmo peso, e
 * link, título e compartilhamento são da comparação.
 * @example c.html(<ComparePage a={a} b={b} theme="auto" />)
 */
export const ComparePage: FC<ComparePageProps> = ({ a, b, theme, stale }) => {
  const meta = compareMeta(a, b);
  const [left, right] = [a.account.username, b.account.username];
  return (
    <Layout
      meta={meta}
      theme={theme}
      topbar={{
        owner: a.account,
        rival: b.account,
        actions: <CompareTopActions a={left} b={right} url={meta.canonicalUrl} />,
      }}
    >
      {stale && <StaleBanner notice={stale} />}
      <CompareBody a={a} b={b} />
    </Layout>
  );
};

const CompareBody: FC<Pair> = ({ a, b }) => {
  const blockerA = comparisonBlocker(a);
  if (blockerA) return <NotComparable blocked={a} reason={blockerA} other={b} />;
  const blockerB = comparisonBlocker(b);
  if (blockerB) return <NotComparable blocked={b} reason={blockerB} other={a} />;
  const [left, right] = [a.account.username, b.account.username];
  return (
    <>
      <Duel a={a} b={b} />
      <Numbers a={a} b={b} />
      <Languages a={a} b={b} />
      <YearByYear a={a} b={b} />
      <AchievementDuel a={a} b={b} />
      <CompareShare share={compareShareLinks(left, right)} a={left} b={right} />
    </>
  );
};
