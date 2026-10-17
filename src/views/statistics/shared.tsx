import type { FC } from 'hono/jsx';
import { viewText } from '../../i18n/view.js';

/** Give dashboard sections a consistent hierarchy. @example <StatisticsSectionHeading id="rank" title="Perfis mais acessados" subtitle="Top 10" /> */
export const StatisticsSectionHeading: FC<{ id: string; title: string; subtitle: string }> = (
  props,
) => (
  <div class="stats-section-head">
    <div>
      <h2 id={props.id}>{viewText(props.title)}</h2>
      <p class="muted">{viewText(props.subtitle)}</p>
    </div>
  </div>
);

/** Explain the scope of public metrics. @example <StatisticsScopeNote /> */
export const StatisticsScopeNote: FC = () => (
  <p class="stats-note muted">
    {viewText(
      'Cada abertura de timeline conta, inclusive repetições e perfis em cache. Os totais incluem apenas o histórico registrado e podem incluir robôs. O dia atual está em andamento; datas em UTC.',
    )}
  </p>
);
