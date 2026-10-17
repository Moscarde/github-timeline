import type { FC } from 'hono/jsx';
import { formatInteger } from '../../i18n/view-format.js';
import { viewText } from '../../i18n/view.js';
import type { StatisticsReport } from '../../services/statistics-service.js';

type Metric = { label: string; value: number; note: string };

/** Show successful activity over the selected period. @example <StatisticsMetrics report={report} /> */
export const StatisticsMetrics: FC<{ report: StatisticsReport }> = ({ report }) => (
  <section class="stats-metrics" aria-label={viewText('Indicadores do período')}>
    {periodMetrics(report).map((metric) => (
      <article class="stats-metric">
        <h2>{viewText(metric.label)}</h2>
        <strong class="mono">{formatInteger(metric.value)}</strong>
        <p class="muted">{viewText(metric.note)}</p>
      </article>
    ))}
  </section>
);

function periodMetrics(report: StatisticsReport): Metric[] {
  const search = report.events.find((row) => row.event === 'search')?.total ?? 0;
  const comparison = report.events.find((row) => row.event === 'comparison')?.total ?? 0;
  return [
    { label: 'Timelines geradas', value: report.periodTimelines, note: 'Aberturas no período' },
    { label: 'Perfis explorados', value: report.profileCount, note: 'Perfis distintos no período' },
    { label: 'Buscas realizadas', value: search, note: 'Buscas válidas no período' },
    { label: 'Comparações vistas', value: comparison, note: 'Comparações abertas no período' },
  ];
}
