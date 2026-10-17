import type { FC } from 'hono/jsx';
import { CANONICAL_ORIGIN } from '../config.js';
import { viewText } from '../i18n/view.js';
import type { ThemePreference } from '../lib/theme.js';
import type { StatisticsReport } from '../services/statistics-service.js';
import { Layout, type PageMeta } from './layout.js';
import { StatisticsChart } from './statistics/chart.js';
import { StatisticsBreakdowns } from './statistics/breakdowns.js';
import { StatisticsHeading } from './statistics/heading.js';
import { StatisticsMetrics } from './statistics/metrics.js';
import { StatisticsScopeNote } from './statistics/shared.js';

type StatisticsPageProps = { report: StatisticsReport; theme: ThemePreference };

/** Public usage dashboard in the shared visual system. @example <StatisticsPage report={report} theme="auto" /> */
export const StatisticsPage: FC<StatisticsPageProps> = ({ report, theme }) => (
  <Layout theme={theme} meta={statisticsMeta()}>
    <div class="stats-page wrap">
      <StatisticsHeading report={report} />
      <StatisticsMetrics report={report} />
      <StatisticsChart daily={report.daily} />
      <StatisticsBreakdowns report={report} />
      <StatisticsScopeNote />
    </div>
  </Layout>
);

function statisticsMeta(): PageMeta {
  return {
    title: viewText('Estatísticas · GitHub Timeline'),
    description: viewText(
      'O uso do GitHub Timeline em números: timelines, evolução diária e perfis mais acessados.',
    ),
    canonicalUrl: `${CANONICAL_ORIGIN}/estatisticas`,
  };
}
