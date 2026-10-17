import type { FC } from 'hono/jsx';
import { formatInteger } from '../../i18n/view-format.js';
import { viewText } from '../../i18n/view.js';
import type { DailyTimelines } from '../../storage/statistics-store.js';
import { statisticsDate } from './format.js';

/** Offer exact daily values to keyboard and screen reader users. @example <StatisticsDailyTable daily={daily} /> */
export const StatisticsDailyTable: FC<{ daily: DailyTimelines[] }> = ({ daily }) => (
  <details class="stats-daily-details">
    <summary>{viewText('Ver valores por dia')}</summary>
    <div class="stats-daily-scroll">
      <table class="stats-table">
        <caption class="sr-only">{viewText('Aberturas por dia')}</caption>
        <DailyTableHead />
        <tbody>
          {daily.map((row) => (
            <DailyRow row={row} />
          ))}
        </tbody>
      </table>
    </div>
  </details>
);

const DailyTableHead: FC = () => (
  <thead>
    <tr>
      <th scope="col">{viewText('Dia (UTC)')}</th>
      <th scope="col">{viewText('Timelines geradas')}</th>
    </tr>
  </thead>
);

const DailyRow: FC<{ row: DailyTimelines }> = ({ row }) => (
  <tr>
    <th scope="row">
      <time datetime={row.day}>{statisticsDate(row.day)}</time>
    </th>
    <td class="mono">{formatInteger(row.total)}</td>
  </tr>
);
