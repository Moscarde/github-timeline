import type { FC } from 'hono/jsx';
import { CANONICAL_HOST, CANONICAL_ORIGIN } from '../../config.js';
import { compareProfiles, comparePath, type CompareRow } from '../../domain/compare.js';
import type { ProfileSnapshot } from '../../domain/snapshot.js';
import type { GithubAccount } from '../../domain/types.js';
import { avatarUrl } from '../../lib/avatar.js';

/** Comparação (§2.4): barras espelhadas no desktop, empilhadas por métrica no celular (M4). */
export const Compare: FC<{ a: ProfileSnapshot; b: ProfileSnapshot }> = ({ a, b }) => {
  const path = comparePath(a.account.username, b.account.username);
  return (
    <section class="sec compare" aria-labelledby="comparar-titulo">
      <div class="wrap">
        <div class="compare-head">
          <h2 class="h2" id="comparar-titulo">
            Comparar
          </h2>
          <div class="mono compare-chips">
            <span class="side-a">{a.account.username}</span>
            <span class="faint">vs</span>
            <a class="side-b" href={`/u/${encodeURIComponent(b.account.username)}`}>
              {b.account.username}
            </a>
          </div>
          <span class="spacer" />
          <span class="muted compare-link">
            Link: <span class="mono">{`${CANONICAL_HOST}${decodeURIComponent(path)}`}</span>
          </span>
        </div>
        <div class="compare-people">
          <Person account={a.account} side="a" />
          <span class="mono faint">vs</span>
          <Person account={b.account} side="b" />
        </div>
        <div class="compare-rows">
          {compareProfiles(a, b).map((row) => (
            <Row row={row} usernameA={a.account.username} usernameB={b.account.username} />
          ))}
        </div>
        <button class="btn-p compare-copy" type="button" data-copy-text={CANONICAL_ORIGIN + path}>
          Copiar link da comparação
        </button>
      </div>
    </section>
  );
};

const Person: FC<{ account: GithubAccount; side: 'a' | 'b' }> = ({ account, side }) => (
  <div class={`compare-person side-${side}`}>
    <img src={avatarUrl(account.avatarUrl, 80)} alt="" width="40" height="40" />
    <span class="mono">{account.username}</span>
  </div>
);

const Row: FC<{ row: CompareRow; usernameA: string; usernameB: string }> = ({
  row,
  usernameA,
  usernameB,
}) => (
  <div class="compare-row">
    <div class="bar-side side-a">
      <span class="mono value" aria-label={`${usernameA}: ${row.a} ${row.label}`}>
        {row.a}
      </span>
      <span class="track">
        <span class="fill" style={`width:${pct(row.aRatio)}`} />
      </span>
    </div>
    <div class="muted compare-label">{row.label}</div>
    <div class="bar-side side-b">
      <span class="track">
        <span class="fill" style={`width:${pct(row.bRatio)}`} />
      </span>
      <span class="mono value" aria-label={`${usernameB}: ${row.b} ${row.label}`}>
        {row.b}
      </span>
    </div>
  </div>
);

function pct(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}
