import type { FC } from 'hono/jsx';
import type { StatisticsReport } from '../../services/statistics-service.js';
import { StatisticsFeatures } from './features.js';
import { StatisticsRanking } from './ranking.js';

/** Show public profiles and anonymous feature usage only. @example <StatisticsBreakdowns report={report} /> */
export const StatisticsBreakdowns: FC<{ report: StatisticsReport }> = ({ report }) => (
  <div class="stats-breakdowns">
    <StatisticsRanking ranking={report.ranking} />
    <StatisticsFeatures events={report.events} />
  </div>
);
