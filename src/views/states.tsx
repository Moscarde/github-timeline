import type { FC } from 'hono/jsx';
import { CANONICAL_ORIGIN } from '../config.js';
import type { GithubAccount } from '../domain/types.js';
import type { ThemePreference } from '../lib/theme.js';
import { Layout } from './layout.js';
import { ProfileHeader } from './profile/header.js';

/** Sem repositórios públicos (§6). */
export const EmptyHistory: FC<{ login: string }> = ({ login }) => (
  <section class="state">
    <h2>A história ainda não começou</h2>
    <p>
      @{login} ainda não tem repositórios públicos. Quando o primeiro aparecer, a timeline começa
      aqui.
    </p>
  </section>
);

/** Organizações não têm timeline; a lista de contribuidores chega na entrega 2. */
export const OrganizationNotice: FC<{ login: string }> = ({ login }) => (
  <section class="state">
    <h2>@{login} é uma organização</h2>
    <p>
      A Timeline conta a trajetória de pessoas. Procure o perfil de quem contribui com esta
      organização.
    </p>
  </section>
);

const STAGES = [
  ['perfil', 'Perfil'],
  ['repositorios', 'Repositórios'],
  ['contribuicoes', 'Contribuições'],
  ['conquistas', 'Conquistas e card'],
] as const;

/** Perfil novo, coletando (§6): skeleton e painel de etapas atualizado por SSE. */
export const CollectingPage: FC<{
  login: string;
  account: GithubAccount | null;
  theme: ThemePreference;
}> = (props) => (
  <Layout meta={pendingMeta(props.login)} theme={props.theme}>
    <div data-collecting={props.login}>
      {props.account ? <ProfileHeader account={props.account} /> : <HeaderSkeleton />}
      <ol class="stages" aria-live="polite">
        {STAGES.map(([stage, label]) => (
          <li data-stage={stage}>{label}</li>
        ))}
      </ol>
      <div class="skeleton-block" aria-hidden="true">
        <div class="skel line wide" />
        <div class="skel grid" />
        <div class="skel line" />
      </div>
      <noscript>
        <p>Recarregue a página em alguns segundos para ver a timeline.</p>
      </noscript>
    </div>
  </Layout>
);

/** Preenchido pelo cliente com o evento `progress` que traz a conta (§6). */
const HeaderSkeleton: FC = () => (
  <section class="profile-head" aria-busy="true" data-pending-header>
    <div class="avatar skel" data-pending-avatar />
    <div class="who">
      <h1 class="skel line wide" data-pending-name />
      <p class="skel line login mono" data-pending-login />
    </div>
  </section>
);

/** Login inexistente (HTTP 404). */
export const NotFoundPage: FC<{ login: string; theme: ThemePreference }> = ({ login, theme }) => (
  <Layout
    meta={{ ...pendingMeta(login), title: 'Perfil não encontrado · Timeline' }}
    theme={theme}
    searchValue={login}
  >
    <section class="state">
      <h2>Perfil não encontrado</h2>
      <p>Não existe conta pública @{login} no GitHub. Confira a grafia e busque de novo.</p>
    </section>
  </Layout>
);

/** GitHub indisponível ou cota esgotada, sem snapshot. A fila chega na entrega 2. */
export const UnavailablePage: FC<{
  login: string;
  theme: ThemePreference;
  retryAt: string | null;
}> = (props) => (
  <Layout meta={pendingMeta(props.login)} theme={props.theme}>
    <section class="state">
      <h2>O GitHub não respondeu agora</h2>
      <p>
        Não foi possível montar a timeline de @{props.login}.
        {props.retryAt
          ? ` Tente de novo depois das ${props.retryAt}.`
          : ' Tente de novo em alguns minutos.'}
      </p>
    </section>
  </Layout>
);

function pendingMeta(login: string) {
  return {
    title: `@${login} · Timeline`,
    description: `Timeline de @${login}: a trajetória pública no GitHub, ano a ano.`,
    canonicalUrl: `${CANONICAL_ORIGIN}/u/${encodeURIComponent(login)}`,
    noindex: true,
  };
}
