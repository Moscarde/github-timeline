import { viewText, viewMessage } from '../../i18n/view.js';
import type { Child, FC } from 'hono/jsx';
import type { CompareSide } from '../../domain/compare.js';
import { alignYears, type CompareYearSide } from '../../domain/compare-years.js';
import { contributionLevel, maxMonth } from '../../domain/contributions.js';
import { plural } from '../../i18n/view-format.js';
import type { ProfileSnapshot } from '../../domain/snapshot.js';
import { TimelineYears } from '../profile/timeline.js';

type ProfilePair = { a: ProfileSnapshot; b: ProfileSnapshot };
type YearTabName = 'resumo' | 'detalhada';

/** Compara os anos em resumo ou com os capítulos completos. @example <YearByYear a={a} b={b} /> */
export const YearByYear: FC<ProfilePair> = (profiles) => (
  <section class="sec" aria-labelledby="ano-a-ano">
    <div class="wrap">
      <div class="sec-head">
        <h2 class="h2" id="ano-a-ano">
          {viewText('Ano a ano')}
        </h2>
        <YearTabs />
      </div>
      <p class="muted timeline-note">{viewText('um quadrado por mês, na escala de cada perfil')}</p>
      <YearPanels {...profiles} />
    </div>
  </section>
);

const YearPanels: FC<ProfilePair> = ({ a, b }) => (
  <>
    <YearPanel name="resumo">
      <YearSummary a={a} b={b} />
    </YearPanel>
    <YearPanel name="detalhada">
      <div class="year-details">
        <DetailedProfile snapshot={a} side="a" />
        <DetailedProfile snapshot={b} side="b" />
      </div>
    </YearPanel>
  </>
);

const YearPanel: FC<{ name: YearTabName; children?: Child }> = ({ name, children }) => (
  <div
    role="tabpanel"
    id={`anos-${name}`}
    aria-labelledby={`aba-anos-${name}`}
    tabindex={0}
    hidden={name !== 'resumo'}
  >
    {children}
  </div>
);

const YearTabs: FC = () => (
  <div class="tabs" role="tablist" aria-label={viewText('Ano a ano')}>
    <YearTab name="resumo" label={viewText('Resumo')} selected />
    <YearTab name="detalhada" label={viewText('Detalhada')} selected={false} />
  </div>
);

type YearTabProps = { name: YearTabName; label: string; selected: boolean };

const YearTab: FC<YearTabProps> = ({ name, label, selected }) => (
  <button
    class="pill"
    type="button"
    role="tab"
    id={`aba-anos-${name}`}
    aria-controls={`anos-${name}`}
    aria-selected={selected ? 'true' : 'false'}
    tabindex={selected ? 0 : -1}
    data-tab={name}
  >
    {label}
  </button>
);

/**
 * "Ano a ano": o mesmo eixo de anos para os dois, com o capítulo e os 12 meses de cada lado.
 * Cada lado usa a escala do próprio perfil, como na timeline individual.
 */
const YearSummary: FC<ProfilePair> = ({ a, b }) => (
  <ol class="year-duel">
    {alignYears(a, b).map((row) => (
      <li class="year-row">
        <YearSide side="a" year={row.year} cell={row.a} snapshot={a} />
        <span class="year-label mono">{row.year}</span>
        <YearSide side="b" year={row.year} cell={row.b} snapshot={b} />
      </li>
    ))}
  </ol>
);

const DetailedProfile: FC<{ snapshot: ProfileSnapshot; side: CompareSide }> = ({
  snapshot,
  side,
}) => (
  <section class={`year-profile side-${side}`} aria-labelledby={`anos-perfil-${side}`}>
    <h3 class="year-profile-heading side-ink" id={`anos-perfil-${side}`}>
      <a href={`/u/${encodeURIComponent(snapshot.account.username)}`}>
        @{snapshot.account.username}
      </a>
    </h3>
    <TimelineYears eras={snapshot.timeline} months={snapshot.months} />
  </section>
);

interface YearSideProps {
  side: CompareSide;
  year: number;
  cell: CompareYearSide;
  snapshot: ProfileSnapshot;
}

const YearSide: FC<YearSideProps> = ({ side, year, cell, snapshot }) => {
  const max = maxMonth(snapshot.months);
  const total = cell.months.reduce((sum, count) => sum + count, 0);
  const label = viewMessage('{0}: {1} em {2}', [
    snapshot.account.username,
    plural(total, 'contribuição', 'contribuições'),
    year,
  ]);
  const created = cell.era?.summary.repoCount ?? 0;
  return (
    <div class={`year-side side-${side}${created ? '' : ' quiet'}`}>
      <span class="year-months" role="img" aria-label={label}>
        {cell.months.map((count) => (
          <i class={`l${contributionLevel(count, max)}`} />
        ))}
      </span>
      <span class="year-title">
        {created ? cell.era?.title : viewText('sem repositórios novos')}
      </span>
      {created > 0 && <span class="mono faint year-count">{plural(created, 'repo', 'repos')}</span>}
    </div>
  );
};
