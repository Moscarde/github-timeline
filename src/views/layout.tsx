import type { Child, FC } from 'hono/jsx';
import { PROJECT_URL } from '../config.js';
import { formatCompact } from '../domain/format.js';
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

/** Documento base: tema já resolvido no servidor (cookie) para não piscar. */
export const Layout: FC<LayoutProps> = ({ meta, theme, topbar = {}, children }) => (
  <html lang="pt-BR" data-theme={DATA_THEME[theme]}>
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
    <body>
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
  /** Landing: navegação e botão "Star" com a contagem do repositório do projeto. */
  landing?: { stars: number | null };
  /** Ações extras à direita (ex.: "Copiar link"). */
  actions?: Child;
  searchValue?: string;
}

const Topbar: FC<TopbarProps> = ({ owner, landing, actions, searchValue }) => (
  <header class="topbar">
    <a class="crumb mono" href="/" aria-label="GitHub Timeline, página inicial">
      {owner?.avatarUrl ? (
        <img class="mark" src={avatarUrl(owner.avatarUrl, 52)} alt="" width="26" height="26" />
      ) : (
        <img class="mark brand-mark" src="/favicon.svg" alt="" width="26" height="26" />
      )}
      <span class="crumb-text">
        <span class="muted">{owner?.username ?? 'github'}</span> <span class="muted">/</span>{' '}
        <b>timeline</b>
      </span>
    </a>
    <span class="spacer" />
    {landing ? <LandingNav stars={landing.stars} /> : <TopSearch value={searchValue} />}
    <ThemeButton />
    {actions}
  </header>
);

const LandingNav: FC<{ stars: number | null }> = ({ stars }) => (
  <>
    <nav class="topnav" aria-label="Seções">
      <a href="#explorar">Explorar</a>
      <a href="#comparar">Comparar</a>
      <a href="#badge">Badge</a>
    </nav>
    <a class="btn star-btn" href={PROJECT_URL} rel="noopener">
      ★ Star{stars !== null && <span class="star-count">{formatCompact(stars)}</span>}
    </a>
  </>
);

const TopSearch: FC<{ value?: string }> = ({ value }) => (
  <>
    <form class="top-search" action="/buscar" method="get" role="search">
      <label class="sr-only" for="busca-topo">
        Buscar usuário do GitHub
      </label>
      <input
        id="busca-topo"
        name="q"
        value={value}
        placeholder="buscar usuário…"
        autocomplete="off"
        spellcheck={false}
      />
    </form>
    <a class="btn search-link" href="/#gerar" aria-label="Buscar usuário">
      ⌕
    </a>
  </>
);

/** Mostra o tema de destino; o CSS escolhe o rótulo certo mesmo no tema automático. */
const ThemeButton: FC = () => (
  <button class="btn theme-btn" type="button" data-theme-toggle aria-label="Alternar tema">
    <span class="theme-light-label">
      ☀<span class="theme-text"> Claro</span>
    </span>
    <span class="theme-dark-label">
      ☾<span class="theme-text"> Escuro</span>
    </span>
  </button>
);

const Footer: FC = () => (
  <footer class="footer">
    <div class="wrap">
      <span>Dados da API pública do GitHub.</span>
      <span class="footer-long">
        Feito por <a href="https://github.com/Moscarde">@Moscarde</a> ·{' '}
        <a href={PROJECT_URL}>código</a>
      </span>
      <span class="footer-short">
        <a href="https://github.com/Moscarde">@Moscarde</a>
      </span>
    </div>
  </footer>
);
