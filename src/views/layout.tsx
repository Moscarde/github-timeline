import { LanguageSelector } from './language-selector.js';
import { clientMessages } from '../i18n/client.js';
import { viewText, useLocale } from '../i18n/view.js';
import { raw } from 'hono/html';
import type { Child, FC } from 'hono/jsx';
import { PROJECT_URL } from '../config.js';
import { formatCompact } from '../i18n/view-format.js';
import { avatarUrl } from '../lib/avatar.js';
import type { ThemePreference } from '../lib/theme.js';

/** Meta tags de compartilhamento; URLs já absolutas no host canônico. */
export interface PageMeta {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl?: string;
  noindex?: boolean;
}

export interface LayoutProps {
  meta: PageMeta;
  theme: ThemePreference;
  topbar?: TopbarProps;
  children?: Child;
}

const DATA_THEME: Record<ThemePreference, string | undefined> = {
  escuro: 'dark',
  claro: 'light',
  auto: undefined,
};

const STYLESHEETS = ['base', 'landing', 'profile', 'compare', 'timeline', 'states'];

/**
 * Documento base: tema já resolvido no servidor (cookie) para não piscar.
 * O doctype mantém o navegador em standards mode; sem ele, forms ganham margem extra.
 */
export const Layout: FC<LayoutProps> = ({ meta, theme, topbar = {}, children }) => (
  <>
    {raw('<!doctype html>')}
    <Document meta={meta} theme={theme} topbar={topbar}>
      {children}
    </Document>
  </>
);

const Document: FC<LayoutProps> = ({ meta, theme, topbar = {}, children }) => (
  <html lang={useLocale()} data-theme={DATA_THEME[theme]}>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{meta.title}</title>
      <MetaTags meta={meta} />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      <link
        rel="preload"
        href="/fonts/mona-sans-latin-400-normal.woff2"
        as="font"
        type="font/woff2"
        crossorigin=""
      />
      {STYLESHEETS.map((name) => (
        <link rel="stylesheet" href={`/assets/css/${name}.css`} />
      ))}
      <script type="module" src="/assets/app.js"></script>
    </head>
    <body data-messages={JSON.stringify(clientMessages(useLocale()))}>
      <Topbar {...topbar} />
      <main id="conteudo">{children}</main>
      <Footer />
    </body>
  </html>
);

const MetaTags: FC<{ meta: PageMeta }> = ({ meta }) => (
  <>
    <meta name="description" content={meta.description} />
    <link rel="canonical" href={meta.canonicalUrl} />
    <link rel="alternate" hreflang="pt-BR" href={`${meta.canonicalUrl}?lang=pt-BR`} />
    <link rel="alternate" hreflang="en" href={`${meta.canonicalUrl}?lang=en`} />
    {meta.noindex && <meta name="robots" content="noindex" />}
    <meta property="og:type" content="profile" />
    <meta property="og:site_name" content="GitHub Timeline" />
    <meta property="og:title" content={meta.title} />
    <meta property="og:description" content={meta.description} />
    <meta property="og:url" content={meta.canonicalUrl} />
    {meta.imageUrl && <meta property="og:image" content={meta.imageUrl} />}
    {meta.imageUrl && <meta property="og:image:width" content="1200" />}
    {meta.imageUrl && <meta property="og:image:height" content="630" />}
    <meta name="twitter:card" content={meta.imageUrl ? 'summary_large_image' : 'summary'} />
  </>
);

export interface TopbarProps {
  /** Perfil aberto: o avatar e o username ocupam o lugar de "github" no caminho. */
  owner?: { username: string; avatarUrl?: string };
  /** Comparação: o segundo perfil divide o caminho com o primeiro ("a vs b / timeline"). */
  rival?: { username: string; avatarUrl: string };
  /** Landing: navegação e botão "Star" com a contagem do repositório do projeto. */
  landing?: { stars: number | null };
  /** Ações extras à direita (ex.: "Copiar link"). */
  actions?: Child;
  searchValue?: string;
}

const Topbar: FC<TopbarProps> = ({ owner, rival, landing, actions, searchValue }) => (
  <header class="topbar">
    <a class="crumb mono" href="/" aria-label={viewText('GitHub Timeline, página inicial')}>
      <span class="marks">
        {owner?.avatarUrl ? (
          <img class="mark" src={avatarUrl(owner.avatarUrl, 52)} alt="" width="26" height="26" />
        ) : (
          <img class="mark brand-mark" src="/favicon.svg" alt="" width="26" height="26" />
        )}
        {rival && (
          <img
            class="mark rival-mark"
            src={avatarUrl(rival.avatarUrl, 52)}
            alt=""
            width="26"
            height="26"
          />
        )}
      </span>
      <span class="crumb-text">
        <CrumbOwner owner={owner} rival={rival} /> <span class="muted">/</span> <b>timeline</b>
      </span>
    </a>
    <span class="spacer" />
    {landing ? <StarButton stars={landing.stars} /> : <TopSearch value={searchValue} />}
    <LanguageSelector />
    <ThemeButton />
    {actions}
  </header>
);

const CrumbOwner: FC<Pick<TopbarProps, 'owner' | 'rival'>> = ({ owner, rival }) => {
  if (!rival) return <span class="muted">{owner?.username ?? 'github'}</span>;
  return (
    <>
      <span class="side-a side-ink">{owner?.username}</span> <span class="faint">vs</span>{' '}
      <span class="side-b side-ink">{rival.username}</span>
    </>
  );
};

const StarButton: FC<{ stars: number | null }> = ({ stars }) => (
  <a class="btn star-btn" href={PROJECT_URL} rel="noopener">
    ★ Star{stars !== null && <span class="star-count">{formatCompact(stars)}</span>}
  </a>
);

const TopSearch: FC<{ value?: string }> = ({ value }) => (
  <>
    <form class="top-search" action="/buscar" method="get" role="search">
      <label class="sr-only" for="busca-topo">
        {viewText('Buscar usuário do GitHub')}
      </label>
      <input
        id="busca-topo"
        name="q"
        value={value}
        placeholder={viewText('buscar usuário…')}
        autocomplete="off"
        spellcheck={false}
      />
    </form>
    <a class="btn search-link" href="/#gerar" aria-label={viewText('Buscar usuário')}>
      ⌕
    </a>
  </>
);

/** Mostra o tema de destino; o CSS escolhe o rótulo certo mesmo no tema automático. */
const ThemeButton: FC = () => (
  <button
    class="btn theme-btn"
    type="button"
    data-theme-toggle
    aria-label={viewText('Alternar tema')}
  >
    <span class="theme-light-label">
      ☀<span class="theme-text">{viewText(' Claro')}</span>
    </span>
    <span class="theme-dark-label">
      ☾<span class="theme-text">{viewText(' Escuro')}</span>
    </span>
  </button>
);

const Footer: FC = () => (
  <footer class="footer">
    <div class="wrap">
      <span>{viewText('Dados da API pública do GitHub.')}</span>
      <span class="footer-long">
        {viewText('Feito por ')}
        <a href="https://github.com/Moscarde">@Moscarde</a> ·{' '}
        <a href={PROJECT_URL}>{viewText('código')}</a>
      </span>
      <span class="footer-short">
        <a href="https://github.com/Moscarde">@Moscarde</a>
      </span>
    </div>
  </footer>
);
