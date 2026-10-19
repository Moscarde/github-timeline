import type { FC } from 'hono/jsx';
import { formatInteger } from '../../i18n/view-format.js';
import { viewText } from '../../i18n/view.js';
import type { EventTotal } from '../../storage/statistics-store.js';
import { StatisticsSectionHeading } from './shared.js';

const FEATURE_LABELS: ReadonlyArray<readonly [string, string]> = [
  ['landing', 'Página inicial'],
  ['card', 'Cards de compartilhamento'],
  ['badge', 'Badges'],
  ['embed', 'Embeds para README'],
  ['api_profile', 'Consultas à API'],
];
type FeatureTotal = { label: string; total: number };

/** Show feature requests as anonymous totals. @example <StatisticsFeatures events={report.events} /> */
export const StatisticsFeatures: FC<{ events: EventTotal[] }> = ({ events }) => (
  <section class="stats-panel" aria-labelledby="stats-features">
    <StatisticsSectionHeading
      id="stats-features"
      title="Outras formas de explorar"
      subtitle="Respostas bem-sucedidas no período"
    />
    <FeatureBars events={events} />
    <p class="stats-note muted">
      {viewText(
        'Imagens servidas pelo cache de navegadores ou proxies não geram um novo registro.',
      )}
    </p>
  </section>
);

const FeatureBars: FC<{ events: EventTotal[] }> = ({ events }) => {
  const features = FEATURE_LABELS.map(([event, label]) => ({
    label,
    total: events.find((row) => row.event === event)?.total ?? 0,
  }));
  const maximum = Math.max(1, ...features.map((row) => row.total));
  return (
    <ul class="stats-features">
      {features.map((feature) => (
        <FeatureBar feature={feature} maximum={maximum} />
      ))}
    </ul>
  );
};

const FeatureBar: FC<{ feature: FeatureTotal; maximum: number }> = ({ feature, maximum }) => (
  <li>
    <div>
      <span>{viewText(feature.label)}</span>
      <strong class="mono">{formatInteger(feature.total)}</strong>
    </div>
    <span class="stats-feature-track" aria-hidden="true">
      <span style={`width:${(feature.total / maximum) * 100}%`} />
    </span>
  </li>
);
