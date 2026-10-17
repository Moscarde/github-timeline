import type { FC } from 'hono/jsx';
import { formatCompact, formatInteger } from '../../i18n/view-format.js';
import { viewMessage, viewText } from '../../i18n/view.js';
import type { ChartGeometry, ChartPoint } from './chart-geometry.js';
import { statisticsDate } from './format.js';

/** Render the daily line on a zero-based scale. @example <StatisticsChartPlot geometry={geometry} /> */
export const StatisticsChartPlot: FC<{ geometry: ChartGeometry }> = ({ geometry }) => (
  <svg
    class="stats-plot"
    viewBox="0 0 980 264"
    role="img"
    aria-labelledby="stats-plot-title stats-plot-desc"
  >
    <title id="stats-plot-title">{viewText('Timelines geradas por dia')}</title>
    <desc id="stats-plot-desc">
      {viewText(
        'Evolução diária das aberturas. Os valores exatos estão na tabela abaixo do gráfico.',
      )}
    </desc>
    <ChartGrid ceiling={geometry.ceiling} />
    <polyline class="stats-series" points={geometry.line} />
    <ChartPoints points={geometry.points} />
    <ChartDates points={geometry.points} />
  </svg>
);

const ChartGrid: FC<{ ceiling: number }> = ({ ceiling }) => (
  <>
    {[0, 1, 2].map((level) => (
      <g>
        <line class="stats-gridline" x1="56" x2="944" y1={220 - level * 88} y2={220 - level * 88} />
        <text class="stats-axis mono" x="44" y={224 - level * 88} text-anchor="end">
          {formatCompact((ceiling * level) / 2)}
        </text>
      </g>
    ))}
  </>
);

const ChartPoints: FC<{ points: ChartPoint[] }> = ({ points }) => (
  <>
    {points.map((point) => (
      <circle class="stats-point" cx={point.x} cy={point.y} r="3">
        <title>
          {viewMessage('{0}: {1} timelines', [
            statisticsDate(point.day),
            formatInteger(point.total),
          ])}
        </title>
      </circle>
    ))}
  </>
);

const ChartDates: FC<{ points: ChartPoint[] }> = ({ points }) => {
  const ticks = new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]);
  return (
    <>
      {points
        .filter((_, index) => ticks.has(index))
        .map((point) => (
          <text class="stats-axis mono" x={point.x} y="250" text-anchor="middle">
            {statisticsDate(point.day)}
          </text>
        ))}
    </>
  );
};
