import { viewText, viewMessage } from '../../i18n/view.js';
import type { FC } from 'hono/jsx';
import { contributionLevel, maxMonth } from '../../domain/contributions.js';
import { formatInteger, formatMonthYear, monthNames, plural } from '../../i18n/view-format.js';
import { languageColor } from '../../domain/language-colors.js';
import type { Era } from '../../domain/timeline.js';
import type { MonthlyContributions, Repo } from '../../domain/types.js';
import { eraLead } from '../era-text.js';
import { Icon } from '../icons.js';

const HIGHLIGHTS_PER_YEAR = 6;

/** Linha do tempo: capítulos por ano, grade mensal de contribuições e destaques. */
export const Timeline: FC<{ eras: Era[]; months: MonthlyContributions }> = ({ eras, months }) => {
  const max = maxMonth(months);
  return (
    <section class="timeline-section wrap" aria-labelledby="linha-do-tempo">
      <div class="sec-head">
        <h2 class="h2" id="linha-do-tempo">
          {viewText('Linha do tempo')}
        </h2>
        <ContributionScale />
      </div>
      <p class="muted timeline-note">
        {viewText(
          'Um quadrado por mês: contribuições públicas no GitHub, incluindo repositórios de organizações.',
        )}
      </p>
      <ol class="timeline">
        {eras.map((era) => (
          <EraBlock era={era} row={months[era.year]} max={max} />
        ))}
      </ol>
    </section>
  );
};

const ContributionScale: FC = () => (
  <div class="muted legend" aria-hidden="true">
    {viewText('menos')}
    {[0, 1, 2, 3, 4].map((level) => (
      <i class={`l${level}`} />
    ))}
    {viewText('mais')}
  </div>
);

const EraBlock: FC<{ era: Era; row: number[] | undefined; max: number }> = (props) => {
  const { era } = props;
  return (
    <li class={era.isRecord ? 'era record' : 'era'} data-era>
      <div class="era-year">
        <div class="year">{era.year}</div>
        <div class="mono muted era-count">
          {plural(era.summary.repoCount, viewText('criado'), viewText('criados'))}
          {era.isRecord && ' · recorde'}
        </div>
      </div>
      <MonthCells year={era.year} row={props.row ?? Array<number>(12).fill(0)} max={props.max} />
      <div class="era-body">
        <h3>{era.title}</h3>
        <p class="muted lead">{eraLead(era.summary).map((part) => part.text)}</p>
        <Skills era={era} />
        <Highlights era={era} />
      </div>
    </li>
  );
};

/** Coluna de meses no desktop; faixa horizontal com iniciais no celular (M3). */
const MonthCells: FC<{ year: number; row: number[]; max: number }> = ({ year, row, max }) => {
  const total = row.reduce((sum, count) => sum + count, 0);
  return (
    <div class="era-rail">
      <div
        class="months"
        role="group"
        aria-label={viewMessage('{0} em {1}, por mês', [
          plural(total, 'contribuição', 'contribuições'),
          year,
        ])}
      >
        {row.map((count, month) => {
          const label = `${monthNames()[month]}/${String(year).slice(2)}: ${plural(count, viewText('contribuição'), viewText('contribuições'))}`;
          return (
            <span
              class={`mo l${contributionLevel(count, max)}`}
              tabindex={0}
              role="img"
              aria-label={label}
            >
              <span class="tip" aria-hidden="true">
                {label}
              </span>
            </span>
          );
        })}
      </div>
      <div class="mono faint month-initials" aria-hidden="true">
        {monthNames().map((month) => (
          <span>{month[0]}</span>
        ))}
      </div>
    </div>
  );
};

const Skills: FC<{ era: Era }> = ({ era }) => {
  if (!era.newLanguages.length && !era.newTopics.length) return null;
  return (
    <ul
      class="skills"
      aria-label={viewMessage('Linguagens e topics que aparecem pela primeira vez em {0}', [
        era.year,
      ])}
    >
      {era.newLanguages.map((language) => (
        <li class="skill lang-skill">
          <i style={`background:${languageColor(language)}`} />
          {language}
        </li>
      ))}
      {era.newTopics.map((topic) => (
        <li class="skill topic-skill">
          <i />
          {topic}
        </li>
      ))}
    </ul>
  );
};

const Highlights: FC<{ era: Era }> = ({ era }) => {
  if (!era.repos.length) return null;
  const shown = era.repos.slice(0, HIGHLIGHTS_PER_YEAR);
  const rest = era.repos.slice(HIGHLIGHTS_PER_YEAR);
  return (
    <>
      <div class="repos">
        {shown.map((repo) => (
          <RepoCard repo={repo} featured={repo.name === era.mostStarredName} />
        ))}
      </div>
      {rest.length > 0 && (
        <>
          <div class="repos more-repos" hidden data-more-repos>
            {rest.map((repo) => (
              <RepoCard repo={repo} featured={false} />
            ))}
          </div>
          <button class="btn more" type="button" data-toggle-repos aria-expanded="false">
            + {plural(rest.length, viewText('repositório'), viewText('repositórios'))}
            {viewText(' de ')}
            {era.year}
          </button>
        </>
      )}
    </>
  );
};

const RepoCard: FC<{ repo: Repo; featured: boolean }> = ({ repo, featured }) => (
  <article class={featured ? 'repo featured' : 'repo'}>
    <header class="repo-head">
      <Icon name="repo" size={16} />
      <a class="name" href={repo.url} rel="noopener">
        {repo.name}
      </a>
      {featured && <span class="tag tag-brand">{viewText('mais estrelado')}</span>}
      {repo.isFork && <span class="tag">fork</span>}
      {repo.archived && <span class="tag">{viewText('arquivado')}</span>}
    </header>
    <p class={repo.description ? 'desc muted' : 'desc muted empty'}>
      {repo.description ?? viewText('Sem descrição.')}
    </p>
    {repo.topics.length > 0 && (
      <ul class="topics">
        {repo.topics.map((topic) => (
          <li>{topic}</li>
        ))}
      </ul>
    )}
    <RepoMeta repo={repo} />
  </article>
);

const RepoMeta: FC<{ repo: Repo }> = ({ repo }) => (
  <p class="repo-meta muted">
    {repo.language && (
      <span class="lang">
        <i class="dot" style={`background:${languageColor(repo.language)}`} />
        {repo.language}
      </span>
    )}
    {!repo.isFork && <span>★ {formatInteger(repo.stars)}</span>}
    <span>⑂ {formatInteger(repo.forks)}</span>
    {isWebUrl(repo.homepage) && (
      <a href={repo.homepage ?? ''} rel="noopener nofollow">
        {viewText('site')}
      </a>
    )}
    <span>
      {viewText('Criado em ')}
      {formatMonthYear(repo.createdAt)}
    </span>
  </p>
);

/** Só links http(s) viram `href`: homepage vem do GitHub e pode conter `javascript:`. */
function isWebUrl(url: string | null): boolean {
  return !!url && /^https?:\/\//i.test(url);
}
