import type { FC } from 'hono/jsx';
import { formatInteger } from '../../domain/format.js';
import type { ProfileSnapshot } from '../../domain/snapshot.js';
import { avatarUrl } from '../../lib/avatar.js';
import { ProfileHeader } from '../profile/header.js';

/** Sem repositórios públicos (§6, S5): sem timeline, uma faixa de meses vazia. */
export const EmptyHistory: FC<{ snapshot: ProfileSnapshot }> = ({ snapshot }) => (
  <section class="state-card wrap">
    <ProfileHeader account={snapshot.account} />
    <p class="state-title">
      A história ainda <span class="ink">não começou.</span>
    </p>
    <p class="muted state-text">
      @{snapshot.account.username} não tem repositórios públicos. Quando o primeiro aparecer, a
      timeline se monta sozinha.
    </p>
    <div class="cells first-row" aria-hidden="true">
      {Array.from({ length: 12 }, (_, index) => (
        <i class={index === 11 ? 'next' : 'l0'} />
      ))}
    </div>
    <div class="state-actions">
      <a class="btn" href="/">
        Ver outro perfil
      </a>
      <a class="btn-p" href="https://github.com/new" rel="noopener">
        É você? Crie o primeiro repo
      </a>
    </div>
  </section>
);

/** Organização (§6, S6): sem timeline própria; lista quem mais contribuiu. */
export const OrganizationPeople: FC<{ snapshot: ProfileSnapshot }> = ({ snapshot }) => {
  const { account, people } = snapshot;
  return (
    <section class="state-card wrap">
      <ProfileHeader account={account} />
      <p class="state-title">
        Timelines contam pessoas.{' '}
        <span class="ink">Veja quem fez o {account.name || account.username}.</span>
      </p>
      <p class="muted state-text">
        Organizações não têm trajetória própria.{' '}
        {people.length
          ? `Estes são os perfis que mais contribuíram nos repositórios públicos de @${account.username}.`
          : `Não encontramos contribuidores públicos nos repositórios de @${account.username}.`}
      </p>
      <ul class="people">
        {people.map((person) => (
          <li>
            <a class="person" href={`/u/${encodeURIComponent(person.username)}`}>
              <img src={avatarUrl(person.avatarUrl, 56)} alt="" width="28" height="28" />
              <span class="mono person-username">@{person.username}</span>
              <span class="muted person-count">{formatInteger(person.contributions)} commits</span>
              <span class="ink person-go">timeline →</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
};

export interface StaleNotice {
  /** Idade do snapshot, ex.: "há 3 horas". */
  age: string;
  /** Hora da próxima atualização, ex.: "14:20"; `null` se a API não informou. */
  retryAt: string | null;
}

const RATE_LIMIT_DOCS =
  'https://docs.github.com/rest/using-the-rest-api/rate-limits-for-the-rest-api';

/** Cota esgotada com snapshot (§6, S4): mostra o snapshot com o aviso de idade. */
export const StaleBanner: FC<{ notice: StaleNotice }> = ({ notice }) => (
  <div class="stale-banner" role="status">
    <div class="wrap">
      <span class="dot warn-dot" aria-hidden="true" />
      <span class="stale-text">
        Mostrando dados de <b>{notice.age}</b>. O GitHub está limitando consultas agora;
        {notice.retryAt ? (
          <>
            {' '}
            atualizamos sozinhos às <b>{notice.retryAt}</b>.
          </>
        ) : (
          ' atualizamos sozinhos em seguida.'
        )}
      </span>
      <a href={RATE_LIMIT_DOCS} rel="noopener">
        Por que isso acontece?
      </a>
    </div>
  </div>
);
