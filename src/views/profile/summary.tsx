import { viewText, viewMessage } from '../../i18n/view.js';
import type { FC } from 'hono/jsx';
import { formatCompact, formatInteger, formatPercent, plural } from '../../i18n/view-format.js';
import { languageColor } from '../../domain/language-colors.js';
import type { LanguageShare } from '../../domain/languages.js';
import type { ProfileSnapshot } from '../../domain/snapshot.js';

/** Resumo (§2.2): manchete, quatro indicadores e barra de linguagens. */
export const Summary: FC<{ snapshot: ProfileSnapshot }> = ({ snapshot }) => (
  <section class="summary" aria-labelledby="resumo">
    <h2 class="eyebrow" id="resumo">
      {viewText('Seu GitHub em resumo')}
    </h2>
    <p class="headline">
      {snapshot.headline.opening} <span class="ink">{snapshot.headline.closing}</span>
    </p>
    <Indicators snapshot={snapshot} />
    <LanguageBar shares={snapshot.languages} />
  </section>
);

const Indicators: FC<{ snapshot: ProfileSnapshot }> = ({ snapshot }) => {
  const { stats } = snapshot;
  const recordCount =
    snapshot.timeline.find((era) => era.year === stats.recordYear)?.summary.repoCount ?? 0;
  return (
    <div class="indicators">
      <Indicator
        value={formatInteger(stats.activeYears)}
        label={viewText('anos de atividade')}
        note={spanText(stats.firstYear, stats.lastYear)}
      />
      <Indicator
        value={formatInteger(stats.repos)}
        label={viewText('repositórios públicos')}
        note={viewMessage('{0} próprios · {1} forks', [
          formatInteger(stats.ownRepos),
          formatInteger(stats.forks),
        ])}
      />
      <Indicator
        value={formatCompact(stats.ownStars)}
        label={viewText('stars nos próprios')}
        note={
          stats.topRepo
            ? `top: ${stats.topRepo.name} ★ ${formatCompact(stats.topRepo.stars)}`
            : viewText('nenhuma ainda')
        }
      />
      <Indicator
        value={stats.recordYear ? String(stats.recordYear) : '—'}
        label={viewText('ano recorde')}
        note={plural(recordCount, 'repositório criado', 'repositórios criados')}
      />
    </div>
  );
};

const Indicator: FC<{ value: string; label: string; note: string }> = (props) => (
  <div class="indicator">
    <div class="value">{props.value}</div>
    <div class="label">{viewText(props.label)}</div>
    <div class="note muted">{props.note}</div>
  </div>
);

/** Barra e legenda de linguagens dos repositórios próprios; também usada na comparação. */
export const LanguageBar: FC<{ shares: LanguageShare[]; owner?: string }> = ({ shares, owner }) => {
  if (!shares.length) return null;
  const description = shares
    .map(
      (share) =>
        `${share.name === 'Outras' ? viewText(share.name) : share.name} ${formatPercent(share.ratio)}`,
    )
    .join(', ');
  return (
    <div class="languages">
      <div
        class="langbar"
        role="img"
        aria-label={viewMessage('Linguagens dos repositórios próprios{0}: {1}', [
          owner ? viewMessage(' de @{0}', [owner]) : '',
          description,
        ])}
      >
        {shares.map((share) => (
          <span
            style={`width:${(share.ratio * 100).toFixed(2)}%;background:${shareColor(share)}`}
          />
        ))}
      </div>
      <ul class="langlegend">
        {shares.map((share) => (
          <li>
            <i class="dot" style={`background:${shareColor(share)}`} />
            <b>{share.name === 'Outras' ? viewText(share.name) : share.name}</b>
            <span class="muted">{formatPercent(share.ratio)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

function shareColor(share: LanguageShare): string {
  return share.name === 'Outras' ? '#8b949e' : languageColor(share.name);
}

function spanText(first: number | null, last: number | null): string {
  if (first === null || last === null) return '—';
  return first === last ? String(first) : `${first} – ${last}`;
}
