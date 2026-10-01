import type { Child, FC } from 'hono/jsx';
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
  /** Conteúdo extra à direita da topbar (ex.: "Copiar link"). */
  topbarActions?: Child;
  searchValue?: string;
  children?: Child;
}

const DATA_THEME: Record<ThemePreference, string | undefined> = {
  escuro: 'dark',
  claro: 'light',
  auto: undefined,
};

/** Documento base: tema já resolvido no servidor (cookie) para não piscar. */
export const Layout: FC<LayoutProps> = ({ meta, theme, topbarActions, searchValue, children }) => (
  <html lang="pt-BR" data-theme={DATA_THEME[theme]}>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{meta.title}</title>
      <MetaTags meta={meta} />
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="icon" type="image/png" sizes="32x32" href="/brand/symbol-32.png" />
      <link
        rel="preload"
        href="/fonts/mona-sans-latin-400-normal.woff2"
        as="font"
        type="font/woff2"
        crossorigin=""
      />
      <link rel="stylesheet" href="/assets/styles.css" />
      <script type="module" src="/assets/app.js"></script>
    </head>
    <body>
      <Topbar searchValue={searchValue}>{topbarActions}</Topbar>
      <main class="wrap" id="conteudo">
        {children}
      </main>
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
    <meta property="og:site_name" content="Timeline" />
    <meta property="og:title" content={meta.title} />
    <meta property="og:description" content={meta.description} />
    <meta property="og:url" content={meta.canonicalUrl} />
    {meta.imageUrl && <meta property="og:image" content={meta.imageUrl} />}
    {meta.imageUrl && <meta property="og:image:width" content="1200" />}
    {meta.imageUrl && <meta property="og:image:height" content="630" />}
    <meta name="twitter:card" content={meta.imageUrl ? 'summary_large_image' : 'summary'} />
  </>
);

const Topbar: FC<{ searchValue?: string; children?: Child }> = ({ searchValue, children }) => (
  <header class="topbar">
    <a class="brand" href="/" aria-label="Timeline, página inicial">
      <img class="logo logo-light" src="/brand/logo-light.svg" alt="" width="122" height="30" />
      <img class="logo logo-dark" src="/brand/logo-dark.svg" alt="" width="122" height="30" />
    </a>
    <span class="spacer" />
    <form class="search" action="/buscar" method="get" role="search">
      <label class="sr-only" for="busca-topo">
        Perfil do GitHub
      </label>
      <input
        id="busca-topo"
        name="q"
        value={searchValue}
        placeholder="login do GitHub"
        autocomplete="off"
        spellcheck={false}
      />
    </form>
    {children}
    <button class="btn icon-btn" type="button" data-theme-toggle aria-label="Alternar tema">
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 1.5v11a5.5 5.5 0 0 1 0-11Z" />
      </svg>
    </button>
  </header>
);

const Footer: FC = () => (
  <footer class="footer wrap">
    <p>
      Dados da API pública do GitHub. Timeline transforma perfis públicos do GitHub em uma história
      ano a ano; não é afiliado ao GitHub. ·{' '}
      <a href="https://github.com/Moscarde/github-timeline">código</a>
    </p>
  </footer>
);
