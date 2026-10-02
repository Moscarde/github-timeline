import type { FC } from 'hono/jsx';
import { compareAchievements, compareProfiles, type CompareRow } from '../../domain/compare.js';
import { sharedLanguages } from '../../domain/compare-verdicts.js';
import type { ProfileSnapshot } from '../../domain/snapshot.js';
import { LanguageBar } from '../profile/summary.js';

type Pair = { a: ProfileSnapshot; b: ProfileSnapshot };

/** Barras espelhadas no desktop, empilhadas por métrica no celular (M4). */
export const Numbers: FC<Pair> = ({ a, b }) => (
  <section class="sec" aria-labelledby="numeros">
    <div class="wrap">
      <h2 class="h2 sec-title" id="numeros">
        Números
      </h2>
      <div class="compare-rows">
        {compareProfiles(a, b).map((row) => (
          <Row row={row} usernameA={a.account.username} usernameB={b.account.username} />
        ))}
      </div>
    </div>
  </section>
);

const Row: FC<{ row: CompareRow; usernameA: string; usernameB: string }> = (props) => {
  const { row } = props;
  return (
    <div class="compare-row">
      <div class="bar-side side-a">
        <span class="mono value" aria-label={`${props.usernameA}: ${row.a} ${row.label}`}>
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
        <span class="mono value" aria-label={`${props.usernameB}: ${row.b} ${row.label}`}>
          {row.b}
        </span>
      </div>
    </div>
  );
};

function pct(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

/** Barra de linguagens de cada lado e as que os dois usaram. */
export const Languages: FC<Pair> = ({ a, b }) => {
  const shared = sharedLanguages(a, b);
  return (
    <section class="sec" aria-labelledby="linguagens">
      <div class="wrap">
        <h2 class="h2 sec-title" id="linguagens">
          Linguagens
        </h2>
        <div class="compare-langs">
          <LanguageBar shares={a.languages} owner={a.account.username} />
          <LanguageBar shares={b.languages} owner={b.account.username} />
        </div>
        <p class="shared-langs">
          <span class="muted">Em comum:</span>
          {shared.length ? shared.map((name) => <span class="tag mono">{name}</span>) : ' nenhuma'}
        </p>
      </div>
    </section>
  );
};

/** Mesmo catálogo de conquistas, com o estado de cada lado. */
export const AchievementDuel: FC<Pair> = ({ a, b }) => (
  <section class="sec" aria-labelledby="conquistas">
    <div class="wrap">
      <h2 class="h2 sec-title" id="conquistas">
        Conquistas
      </h2>
      <ul class="achievement-duel">
        {compareAchievements(a, b).map((pair) => (
          <li class="achievement-pair">
            <span>{pair.title}</span>
            <span class="pips">
              <Pip side="a" username={a.account.username} unlocked={pair.a} />
              <Pip side="b" username={b.account.username} unlocked={pair.b} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

const Pip: FC<{ side: 'a' | 'b'; username: string; unlocked: boolean }> = (props) => (
  <span
    class={`pip mono side-${props.side}${props.unlocked ? '' : ' off'}`}
    role="img"
    aria-label={`${props.username}: ${props.unlocked ? 'desbloqueada' : 'bloqueada'}`}
  >
    {props.side.toUpperCase()}
  </span>
);
