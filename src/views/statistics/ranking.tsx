import type { FC } from 'hono/jsx';
import { formatInteger } from '../../i18n/view-format.js';
import { viewText } from '../../i18n/view.js';
import type { RankedProfile } from '../../storage/statistics-store.js';
import { StatisticsSectionHeading } from './shared.js';

/** Rank public GitHub profiles, never visitors. @example <StatisticsRanking ranking={report.ranking} /> */
export const StatisticsRanking: FC<{ ranking: RankedProfile[] }> = ({ ranking }) => (
  <section class="stats-panel" aria-labelledby="stats-ranking">
    <StatisticsSectionHeading
      id="stats-ranking"
      title="Perfis mais acessados"
      subtitle="Top 10 por aberturas no período"
    />
    {ranking.length === 0 ? (
      <p class="stats-empty muted">{viewText('O próximo perfil pode ser o primeiro.')}</p>
    ) : (
      <ol class="stats-ranking">
        {ranking.map((profile, index) => (
          <RankedRow profile={profile} rank={index + 1} />
        ))}
      </ol>
    )}
  </section>
);

const RankedRow: FC<{ profile: RankedProfile; rank: number }> = ({ profile, rank }) => (
  <li>
    <span class="mono faint">{String(rank).padStart(2, '0')}</span>
    <a class="mono" href={`/u/${encodeURIComponent(profile.username)}`}>
      @{profile.username}
    </a>
    <span class="mono stats-rank-total">
      {formatInteger(profile.total)}
      <span class="sr-only"> {viewText('aberturas')}</span>
    </span>
  </li>
);
