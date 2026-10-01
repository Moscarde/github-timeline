import type { FC } from 'hono/jsx';
import { CANONICAL_ORIGIN } from '../../config.js';
import type { UsernameSuggestion } from '../../github/username-suggester.js';
import { avatarUrl } from '../../lib/avatar.js';
import type { ThemePreference } from '../../lib/theme.js';
import { decorativeLevel, seededRandom } from '../decorative.js';
import { Layout, type PageMeta } from '../layout.js';

const STAGES = [
  ['perfil', 'Perfil'],
  ['repositorios', 'Repositórios públicos'],
  ['contribuicoes', 'Contribuições por mês'],
  ['conquistas', 'Conquistas e card'],
] as const;

/** Perfil novo, coletando (§6, S1): skeleton e painel de etapas atualizado por SSE. */
export const CollectingPage: FC<{ username: string; theme: ThemePreference }> = ({
  username,
  theme,
}) => (
  <Layout meta={pendingMeta(username)} theme={theme} topbar={{ owner: { username } }}>
    <section class="collecting wrap" data-collecting={username}>
      <div class="collecting-main" aria-busy="true">
        <HeaderSkeleton username={username} />
        <div class="sk" style="height:76px;width:92%;margin-top:22px" />
        <div class="sk" style="height:76px;width:64%" />
        <div class="sk-tiles">
          {[1, 2, 3, 4].map(() => (
            <div class="sk" />
          ))}
        </div>
      </div>
      <StepsPanel />
      <noscript>
        <p>Recarregue a página em alguns segundos para ver a timeline.</p>
      </noscript>
    </section>
  </Layout>
);

/** Preenchido pelo cliente com o evento `progress` que traz a conta (§6). */
const HeaderSkeleton: FC<{ username: string }> = ({ username }) => (
  <div class="profile-head" data-pending-header>
    <div class="avatar sk" data-pending-avatar />
    <div class="who">
      <div class="who-name" data-pending-name>
        {username}
      </div>
      <div class="mono muted who-username">@{username} · coletando…</div>
    </div>
  </div>
);

const StepsPanel: FC = () => (
  <aside class="steps-panel" aria-label="Progresso da coleta">
    <div class="mono muted steps-title">Montando a timeline</div>
    <ol class="steps" aria-live="polite">
      {STAGES.map(([stage, label], index) => (
        <li class={index === 0 ? 'step active' : 'step'} data-stage={stage}>
          <span class="tick" aria-hidden="true" />
          <span class="step-label">{label}</span>
          <span class="mono faint step-note" />
        </li>
      ))}
    </ol>
    <div class="progress" aria-hidden="true">
      <span data-progress style="width:6%" />
    </div>
    <p class="muted steps-note">
      Perfis já vistos abrem na hora. Este é novo: coletando agora, leva uns segundos.
    </p>
  </aside>
);

/** Username inexistente (HTTP 404, S3): "Você quis dizer" vem de `/search/users`. */
export const NotFoundPage: FC<{
  username: string;
  theme: ThemePreference;
  suggestion: UsernameSuggestion | null;
}> = ({ username, theme, suggestion }) => (
  <Layout
    meta={{ ...pendingMeta(username), title: 'Perfil não encontrado · GitHub Timeline' }}
    theme={theme}
    topbar={{ searchValue: username }}
  >
    <section class="state wrap">
      <div class="state-copy">
        <div class="mono state-code danger">404 · github.com/{username}</div>
        <h1>
          <span class="desktop-only">Nenhum commit, nenhuma história. </span>
          <span class="muted">Esse perfil não existe.</span>
        </h1>
        <p>
          Confira a grafia: usernames do GitHub não diferenciam maiúsculas, mas aceitam só letras,
          números e hífen.
        </p>
        {suggestion && <Suggestion suggestion={suggestion} />}
        <form class="state-search" action="/buscar" method="get" role="search">
          <input
            class="mono"
            name="q"
            placeholder="buscar outro usuário…"
            aria-label="Buscar outro usuário"
          />
        </form>
      </div>
      <div class="cells empty-cells" aria-hidden="true">
        {Array.from({ length: 84 }, (_, index) => (
          <i class="l0" style={`opacity:${(0.25 + ((index * 37) % 11) / 20).toFixed(2)}`} />
        ))}
      </div>
    </section>
  </Layout>
);

const Suggestion: FC<{ suggestion: UsernameSuggestion }> = ({ suggestion }) => (
  <div class="suggest">
    <span class="muted">Você quis dizer:</span>
    <a class="chip suggest-chip" href={`/u/${encodeURIComponent(suggestion.username)}`}>
      <img src={avatarUrl(suggestion.avatarUrl, 56)} alt="" width="20" height="20" />
      <span class="mono">{suggestion.username}</span>
      <span class="ink suggest-go">abrir →</span>
    </a>
  </div>
);

/** Por que não deu para coletar agora: cota do servidor ou limite de coletas novas por IP. */
export type UnavailableReason = 'cota' | 'limite-ip';

const UNAVAILABLE_COPY: Record<UnavailableReason, { code: string; title: string; text: string }> = {
  cota: {
    code: 'Sem snapshot anterior',
    title: 'Muita gente olhando o GitHub agora.',
    text: 'o GitHub está limitando consultas. Esta página atualiza sozinha quando der para coletar.',
  },
  'limite-ip': {
    code: 'Limite de timelines novas',
    title: 'Calma: muitas timelines novas daqui.',
    text: 'este endereço já gerou várias timelines novas há pouco. Perfis já gerados continuam abrindo na hora; esta página tenta de novo sozinha.',
  },
};

/** Sem snapshot e sem poder coletar agora (S4): a página tenta de novo sozinha. */
export const UnavailablePage: FC<{
  username: string;
  theme: ThemePreference;
  reason: UnavailableReason;
  retryAt: string | null;
  retryInSeconds: number;
}> = (props) => {
  const copy = UNAVAILABLE_COPY[props.reason];
  return (
    <Layout
      meta={pendingMeta(props.username)}
      theme={props.theme}
      topbar={{ searchValue: props.username }}
    >
      <section class="state wrap" data-retry-in={props.retryInSeconds}>
        <div class="state-copy">
          <div class="mono state-code warn">{copy.code}</div>
          <h1 class="state-h1-sm">{copy.title}</h1>
          <p>
            Ainda não temos uma cópia salva de @{props.username} e {copy.text}
          </p>
          <div class="state-actions">
            <a class="btn-p" href={`/u/${encodeURIComponent(props.username)}`}>
              Tentar agora
            </a>
            <span class="mono faint">
              nova tentativa {props.retryAt ? `às ${props.retryAt}` : 'em instantes'}
            </span>
          </div>
        </div>
        <QueueCells />
      </section>
    </Layout>
  );
};

/** Grade que "enche" de cima para baixo, sugerindo a fila. */
const QueueCells: FC = () => {
  const next = seededRandom(11);
  return (
    <div class="queue-rows" aria-hidden="true">
      {Array.from({ length: 5 }, (_, row) => (
        <div class="cells">
          {Array.from({ length: 12 }, (_, column) => (
            <i class={`l${column <= row * 3 + 1 ? decorativeLevel(next) : 0}`} />
          ))}
        </div>
      ))}
    </div>
  );
};

function pendingMeta(username: string): PageMeta {
  return {
    title: `@${username} · GitHub Timeline`,
    description: `Timeline de @${username}: a trajetória pública no GitHub, ano a ano.`,
    canonicalUrl: `${CANONICAL_ORIGIN}/u/${encodeURIComponent(username)}`,
    noindex: true,
  };
}
