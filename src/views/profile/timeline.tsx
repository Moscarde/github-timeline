import type { FC } from 'hono/jsx';
import { formatInteger, formatMonthYear, MONTHS_PT, plural } from '../../domain/format.js';
import { languageColor } from '../../domain/language-colors.js';
import type { Era } from '../../domain/timeline.js';
import type { MonthlyContributions, Repo } from '../../domain/types.js';
import { eraLead } from '../era-text.js';
import { Icon } from '../icons.js';

/** Anos exibidos antes do botão "Ver AAAA – AAAA" (§4.3). */
export const VISIBLE_ERAS = 4;
const HIGHLIGHTS_PER_YEAR = 6;

/** Linha do tempo: capítulos por ano, grade mensal de contribuições e destaques. */
export const Timeline: FC<{ eras: Era[]; months: MonthlyContributions }> = ({ eras, months }) => {
  const max = Math.max(1, ...Object.values(months).flat());
  const hidden = eras.slice(VISIBLE_ERAS);
  return (
    <section class="timeline-section" aria-labelledby="linha-do-tempo">
      <h2 class="eyebrow" id="linha-do-tempo">
        Linha do tempo
      </h2>
      <ContributionLegend />
      <ol class="timeline">
        {eras.map((era, index) => (
          <EraBlock era={era} row={months[era.year]} max={max} hidden={index >= VISIBLE_ERAS} />
        ))}
      </ol>
      {hidden.length > 0 && (
        <button class="btn more-eras" type="button" data-more-eras>
          Ver {hidden[0]?.year} – {hidden[hidden.length - 1]?.year}
        </button>
      )}
    </section>
  );
};

const ContributionLegend: FC = () => (
  <p class="legend">
    Um quadrado por mês: contribuições públicas, incluindo repositórios de organizações.
    <span class="scale" aria-hidden="true">
      menos <i class="l0" />
      <i class="l1" />
      <i class="l2" />
      <i class="l3" />
      <i class="l4" /> mais
    </span>
  </p>
);

const EraBlock: FC<{ era: Era; row: number[] | undefined; max: number; hidden: boolean }> = (
  props,
) => {
  const { era } = props;
  return (
    <li class={era.isRecord ? 'era record' : 'era'} hidden={props.hidden} data-era>
      <div class="era-rail">
        <span class="node" />
        <span class="year">{era.year}</span>
        {era.isRecord && <span class="record-tag">ano recorde</span>}
      </div>
      <MonthGrid year={era.year} row={props.row ?? Array<number>(12).fill(0)} max={props.max} />
      <div class="era-body">
        <h3>{era.title}</h3>
        <p class="lead">
          {eraLead(era.summary).map((part) => (part.strong ? <b>{part.text}</b> : part.text))}
        </p>
        <Skills era={era} />
        <Highlights era={era} />
      </div>
    </li>
  );
};

const MonthGrid: FC<{ year: number; row: number[]; max: number }> = ({ year, row, max }) => {
  const total = row.reduce((sum, count) => sum + count, 0);
  return (
    <div
      class="months"
      role="group"
      aria-label={`${plural(total, 'contribuição', 'contribuições')} em ${year}, por mês`}
    >
      {row.map((count, month) => {
        const label = `${MONTHS_PT[month]}/${year}: ${plural(count, 'contribuição', 'contribuições')}`;
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
  );
};

/**
 * Intensidade 0–4 relativa ao maior mês do perfil.
 * @example contributionLevel(50, 100) // 2
 */
export function contributionLevel(count: number, max: number): number {
  if (count <= 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((count / max) * 4)));
}

const Skills: FC<{ era: Era }> = ({ era }) => {
  if (!era.newLanguages.length && !era.newTopics.length) return null;
  return (
    <ul
      class="skills"
      aria-label={`Linguagens e topics que aparecem pela primeira vez em ${era.year}`}
    >
      {era.newLanguages.map((language) => (
        <li class="skill lang">
          <i style={`background:${languageColor(language)}`} />
          {language}
        </li>
      ))}
      {era.newTopics.map((topic) => (
        <li class="skill">{topic}</li>
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
          <div class="repos" hidden data-more-repos>
            {rest.map((repo) => (
              <RepoCard repo={repo} featured={false} />
            ))}
          </div>
          <button class="btn more" type="button" data-toggle-repos aria-expanded="false">
            Mostrar todos ({era.repos.length})
          </button>
        </>
      )}
    </>
  );
};

const RepoCard: FC<{ repo: Repo; featured: boolean }> = ({ repo, featured }) => (
  <article class={featured ? 'repo featured' : 'repo'}>
    <header class="repo-head">
      <Icon name="repo" size={14} />
      <a class="name" href={repo.url} rel="noopener">
        {repo.name}
      </a>
      {featured && <span class="pill star-pill">mais estrelado</span>}
      {repo.isFork && <span class="pill">fork</span>}
      {repo.archived && <span class="pill">arquivado</span>}
    </header>
    <p class={repo.description ? 'desc' : 'desc empty'}>{repo.description ?? 'Sem descrição.'}</p>
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
  <p class="repo-meta">
    {repo.language && (
      <span>
        <i class="dot" style={`background:${languageColor(repo.language)}`} />
        {repo.language}
      </span>
    )}
    {!repo.isFork && repo.stars > 0 && (
      <span>
        <Icon name="star" size={12} /> {formatInteger(repo.stars)}
      </span>
    )}
    {repo.forks > 0 && (
      <span>
        <Icon name="fork" size={12} /> {formatInteger(repo.forks)}
      </span>
    )}
    {isWebUrl(repo.homepage) && (
      <a href={repo.homepage ?? ''} rel="noopener nofollow">
        <Icon name="link" size={12} /> site
      </a>
    )}
    <span>criado em {formatMonthYear(repo.createdAt)}</span>
  </p>
);

/** Só links http(s) viram `href`: homepage vem do GitHub e pode conter `javascript:`. */
function isWebUrl(url: string | null): boolean {
  return !!url && /^https?:\/\//i.test(url);
}
