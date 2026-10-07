import { storedText, viewText, viewMessage } from '../../i18n/view.js';
import type { FC } from 'hono/jsx';
import type { CompareSide } from '../../domain/compare.js';
import { compareVerdicts, type Verdict } from '../../domain/compare-verdicts.js';
import type { ProfileSnapshot } from '../../domain/snapshot.js';
import { avatarUrl } from '../../lib/avatar.js';

/** Topo da comparação (1a): os dois perfis com o mesmo peso e as frases que resumem o duelo. */
export const Duel: FC<{ a: ProfileSnapshot; b: ProfileSnapshot }> = ({ a, b }) => (
  <section class="duel-hero" aria-labelledby="duelo">
    <div class="wrap">
      <h1 class="sr-only" id="duelo">
        {viewText('Comparação: ')}
        {a.account.username} vs {b.account.username}
      </h1>
      <div class="duel">
        <Contender snapshot={a} side="a" />
        <span class="duel-vs mono" aria-hidden="true">
          vs
        </span>
        <Contender snapshot={b} side="b" />
      </div>
      <Verdicts verdicts={compareVerdicts(a, b)} a={a} b={b} />
    </div>
  </section>
);

const Contender: FC<{ snapshot: ProfileSnapshot; side: CompareSide }> = ({ snapshot, side }) => {
  const { account, headline, stats } = snapshot;
  return (
    <div class={`contender side-${side}`}>
      <img
        class="contender-avatar"
        src={avatarUrl(account.avatarUrl, 144)}
        alt=""
        width="72"
        height="72"
      />
      <p class="contender-name">{account.name || account.username}</p>
      <p class="mono muted contender-username">
        @{account.username}
        {stats.firstYear !== null && viewMessage(' · desde {0}', [stats.firstYear])}
      </p>
      <p class="contender-headline">
        {headline.opening} <span class="side-ink">{headline.closing}</span>
      </p>
      <a class="contender-link" href={`/u/${encodeURIComponent(account.username)}`}>
        {viewText('Ver timeline completa')}
      </a>
    </div>
  );
};

const Verdicts: FC<{ verdicts: Verdict[]; a: ProfileSnapshot; b: ProfileSnapshot }> = (props) => {
  if (!props.verdicts.length) return null;
  const usernames = { a: props.a.account.username, b: props.b.account.username };
  return (
    <ul class="verdicts" aria-label={viewText('Resumo da comparação')}>
      {props.verdicts.map((verdict) => (
        <li class="verdict">
          {verdict.side && (
            <b class={`mono side-${verdict.side} side-ink`}>{usernames[verdict.side]} </b>
          )}
          {storedText(verdict.text)}
        </li>
      ))}
    </ul>
  );
};
