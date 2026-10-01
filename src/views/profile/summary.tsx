import type { FC } from 'hono/jsx';
import { formatCompact, formatInteger, formatPercent, plural } from '../../domain/format.js';
import { languageColor } from '../../domain/language-colors.js';
import type { LanguageShare } from '../../domain/languages.js';
import type { ProfileSnapshot } from '../../domain/snapshot.js';

/** Resumo (§2.2): manchete, quatro indicadores e barra de linguagens. */
export const Summary: FC<{ snapshot: ProfileSnapshot }> = ({ snapshot }) => (
  <section class="summary" aria-labelledby="resumo">
    <h2 class="eyebrow" id="resumo">
      Resumo
    </h2>
    <p class="headline">{snapshot.headline.full}</p>
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
        label="anos de atividade"
        note={spanText(stats.firstYear, stats.lastYear)}
      />
      <Indicator
        value={formatInteger(stats.repos)}
        label="repositórios públicos"
        note={`${formatInteger(stats.ownRepos)} próprios · ${formatInteger(stats.forks)} forks`}
      />
      <Indicator
        value={formatCompact(stats.ownStars)}
        label="stars nos próprios"
        note={stats.topRepo ? `destaque: ${stats.topRepo.name}` : 'nenhuma ainda'}
      />
      <Indicator
        value={stats.recordYear ? String(stats.recordYear) : '—'}
        label="ano recorde"
        note={plural(recordCount, 'repositório criado', 'repositórios criados')}
        accent
      />
    </div>
  );
};

const Indicator: FC<{ value: string; label: string; note: string; accent?: boolean }> = (props) => (
  <div class={props.accent ? 'indicator accent' : 'indicator'}>
    <div class="value">{props.value}</div>
    <div class="label">{props.label}</div>
    <div class="note">{props.note}</div>
  </div>
);

const LanguageBar: FC<{ shares: LanguageShare[] }> = ({ shares }) => {
  if (!shares.length) return null;
  const description = shares
    .map((share) => `${share.name} ${formatPercent(share.ratio)}`)
    .join(', ');
  return (
    <div class="languages">
      <div
        class="langbar"
        role="img"
        aria-label={`Linguagens dos repositórios próprios: ${description}`}
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
            <b>{share.name}</b> <span class="muted">{formatPercent(share.ratio)}</span>
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
  return first === last ? String(first) : `${first}–${last}`;
}
