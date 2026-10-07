import { viewText } from '../../i18n/view.js';
import type { FC } from 'hono/jsx';
import { formatCompact, formatInteger } from '../../i18n/view-format.js';
import type { GalleryCard } from '../../domain/gallery.js';
import { languageColor } from '../../domain/language-colors.js';
import { avatarUrl } from '../../lib/avatar.js';
import type { GalleryTab } from '../../services/gallery-service.js';

/** "Perfis para explorar" (§2.1): abas com cards servidos de snapshots. */
export const Gallery: FC<{ tabs: GalleryTab[] }> = ({ tabs }) => (
  <section class="gallery" id="explorar" aria-labelledby="explorar-titulo">
    <div class="wrap">
      <div class="gallery-head">
        <h2 id="explorar-titulo">{viewText('Perfis para explorar')}</h2>
        <div class="tabs" role="tablist" aria-label={viewText('Listas de perfis')}>
          {tabs.map((tab, index) => (
            <button
              class="pill"
              type="button"
              role="tab"
              id={`aba-${tab.id}`}
              aria-controls={`painel-${tab.id}`}
              aria-selected={index === 0 ? 'true' : 'false'}
              data-tab={tab.id}
            >
              {viewText(tab.label)}
            </button>
          ))}
        </div>
      </div>
      {tabs.map((tab, index) => (
        <div
          class="gallery-grid"
          role="tabpanel"
          id={`painel-${tab.id}`}
          aria-labelledby={`aba-${tab.id}`}
          hidden={index > 0}
        >
          {tab.cards.length ? (
            tab.cards.map((card) => <ProfileCard card={card} />)
          ) : (
            <p class="muted gallery-empty">{emptyText(tab.id)}</p>
          )}
        </div>
      ))}
    </div>
  </section>
);

function emptyText(id: GalleryTab['id']): string {
  return id === 'em-alta'
    ? viewText('Nenhuma timeline visitada nos últimos 7 dias. Gere a primeira.')
    : viewText('Os perfis desta lista ainda estão sendo coletados. Volte em alguns minutos.');
}

const ProfileCard: FC<{ card: GalleryCard }> = ({ card }) => (
  <a class="profile-card" href={`/u/${encodeURIComponent(card.username)}`}>
    <div class="profile-card-head">
      <img src={avatarUrl(card.avatarUrl, 88)} alt="" width="44" height="44" loading="lazy" />
      <div class="profile-card-who">
        <div class="profile-card-name">{card.name}</div>
        <div class="mono muted profile-card-username">
          @{card.username}
          <span class="desktop-only">
            {viewText(' · desde ')}
            {card.since}
          </span>
          <span class="mobile-only">
            {card.language && ` · ${card.language}`} · ★ {formatCompact(card.stars)}
          </span>
        </div>
      </div>
      <span class="mono muted rank">#{card.rank}</span>
    </div>
    <div class="mini-grid" aria-hidden="true">
      {card.levels.map((level) => (
        <i class={`l${level}`} />
      ))}
    </div>
    <div class="profile-card-meta muted">
      {card.language && (
        <span class="lang">
          <i class="dot" style={`background:${languageColor(card.language)}`} />
          {card.language}
        </span>
      )}
      <span>{formatInteger(card.repos)} repos</span>
      <span>★ {formatCompact(card.stars)}</span>
    </div>
  </a>
);
