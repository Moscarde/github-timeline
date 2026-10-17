import type { FC } from 'hono/jsx';
import { viewText } from '../../i18n/view.js';
import type { DailyTimelines } from '../../storage/statistics-store.js';
import { chartGeometry } from './chart-geometry.js';
import { StatisticsChartPlot } from './chart-plot.js';
import { StatisticsDailyTable } from './daily-table.js';
import { StatisticsSectionHeading } from './shared.js';

/** Daily activity with an accessible exact-value table. @example <StatisticsChart daily={report.daily} /> */
export const StatisticsChart: FC<{ daily: DailyTimelines[] }> = ({ daily }) => (
  <section class="stats-panel stats-chart" aria-labelledby="stats-evolution">
    <StatisticsSectionHeading
      id="stats-evolution"
      title="Timelines ao longo do tempo"
      subtitle="Aberturas por dia · período selecionado · UTC"
    />
    <DailyActivity daily={daily} />
    <StatisticsDailyTable daily={daily} />
  </section>
);

const DailyActivity: FC<{ daily: DailyTimelines[] }> = ({ daily }) => {
  if (daily.every((row) => row.total === 0)) {
    return (
      <p class="stats-empty muted">{viewText('Nenhuma abertura registrada neste período.')}</p>
    );
  }
  return (
    <div
      class="stats-plot-scroll"
      tabindex={0}
      role="region"
      aria-label={viewText('Gráfico de aberturas por dia')}
    >
      <StatisticsChartPlot geometry={chartGeometry(daily)} />
    </div>
  );
};
