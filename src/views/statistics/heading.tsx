import type { FC } from 'hono/jsx';
import { formatInteger } from '../../i18n/view-format.js';
import { viewMessage, viewText } from '../../i18n/view.js';
import type { StatisticsReport } from '../../services/statistics-service.js';
import { statisticsDate } from './format.js';

/** Summarize cumulative usage above period filters. @example <StatisticsHeading report={report} /> */
export const StatisticsHeading: FC<{ report: StatisticsReport }> = ({ report }) => (
  <header class="stats-heading">
    <p class="mono stats-eyebrow">{viewText('Estatísticas de uso')}</p>
    <h1>
      {viewText('Cada timeline,')}
      <br />
      <span class="ink">{viewText('uma nova história.')}</span>
    </h1>
    <p class="muted stats-intro">
      {viewMessage('{0} timelines geradas no total.', [formatInteger(report.allTimeTimelines)])}
    </p>
    <p class="muted">
      {viewText(
        'Dados agregados de uso. Nenhum IP, identificador de visitante ou busca individual é exibido.',
      )}
    </p>
    <PeriodSelection report={report} />
  </header>
);

const PeriodSelection: FC<{ report: StatisticsReport }> = ({ report }) => (
  <div class="stats-period-row">
    <PeriodLinks period={report.period} />
    <span class="mono muted stats-range">
      {statisticsDate(report.start)} — {statisticsDate(report.end)} · UTC
    </span>
  </div>
);

const PeriodLinks: FC<{ period: number }> = ({ period }) => (
  <nav class="stats-periods" aria-label={viewText('Período das estatísticas')}>
    {([7, 30, 90] as const).map((days) => (
      <a
        class="pill"
        href={`/estatisticas?dias=${days}`}
        aria-current={period === days ? 'page' : undefined}
      >
        {viewMessage('{0} dias', [days])}
      </a>
    ))}
  </nav>
);
