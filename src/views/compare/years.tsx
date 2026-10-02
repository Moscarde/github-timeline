import type { FC } from 'hono/jsx';
import type { CompareSide } from '../../domain/compare.js';
import { alignYears, type CompareYearSide } from '../../domain/compare-years.js';
import { contributionLevel, maxMonth } from '../../domain/contributions.js';
import { plural } from '../../domain/format.js';
import type { ProfileSnapshot } from '../../domain/snapshot.js';

/**
 * "Ano a ano": o mesmo eixo de anos para os dois, com o capítulo e os 12 meses de cada lado.
 * Cada lado usa a escala do próprio perfil, como na timeline individual.
 */
export const YearByYear: FC<{ a: ProfileSnapshot; b: ProfileSnapshot }> = ({ a, b }) => {
  const max = { a: maxMonth(a.months), b: maxMonth(b.months) };
  const usernames = { a: a.account.username, b: b.account.username };
  return (
    <section class="sec" aria-labelledby="ano-a-ano">
      <div class="wrap">
        <div class="sec-head">
          <h2 class="h2" id="ano-a-ano">
            Ano a ano
          </h2>
          <span class="muted sec-note">um quadrado por mês, na escala de cada perfil</span>
        </div>
        <ol class="year-duel">
          {alignYears(a, b).map((row) => (
            <li class="year-row">
              <YearSide side="a" year={row.year} cell={row.a} max={max.a} username={usernames.a} />
              <span class="year-label mono">{row.year}</span>
              <YearSide side="b" year={row.year} cell={row.b} max={max.b} username={usernames.b} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

interface YearSideProps {
  side: CompareSide;
  year: number;
  cell: CompareYearSide;
  max: number;
  username: string;
}

const YearSide: FC<YearSideProps> = ({ side, year, cell, max, username }) => {
  const total = cell.months.reduce((sum, count) => sum + count, 0);
  const label = `${username}: ${plural(total, 'contribuição', 'contribuições')} em ${year}`;
  const created = cell.era?.summary.repoCount ?? 0;
  return (
    <div class={`year-side side-${side}${created ? '' : ' quiet'}`}>
      <span class="year-months" role="img" aria-label={label}>
        {cell.months.map((count) => (
          <i class={`l${contributionLevel(count, max)}`} />
        ))}
      </span>
      <span class="year-title">{created ? cell.era?.title : 'sem repositórios novos'}</span>
      {created > 0 && <span class="mono faint year-count">{plural(created, 'repo', 'repos')}</span>}
    </div>
  );
};
