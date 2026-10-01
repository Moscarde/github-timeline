import type { FC } from 'hono/jsx';
import { CANONICAL_ORIGIN } from '../config.js';
import type { ThemePreference } from '../lib/theme.js';
import { Layout } from './layout.js';
import { CopyField } from './profile/share-cta.js';

const BADGE_EXAMPLE_LOGIN = 'torvalds';

/** Landing (§2.1). Galeria, contador semanal e comparação chegam nas entregas 2 e 3. */
export const LandingPage: FC<{ theme: ThemePreference; error?: string }> = ({ theme, error }) => (
  <Layout
    theme={theme}
    meta={{
      title: 'Timeline · a trajetória de um perfil do GitHub, ano a ano',
      description:
        'Digite um login e veja a história pública de um perfil do GitHub: linguagens, marcos, conquistas e contribuições, ano a ano.',
      canonicalUrl: `${CANONICAL_ORIGIN}/`,
    }}
  >
    <Hero error={error} />
    <BadgeSection />
  </Layout>
);

const Hero: FC<{ error?: string }> = ({ error }) => (
  <section class="hero">
    <DecorativeGrid />
    <h1>A trajetória de um perfil do GitHub, ano a ano</h1>
    <p class="muted">
      Linguagens que chegaram, repositórios que marcaram e contribuições públicas, mês a mês.
    </p>
    <form class="hero-search" action="/buscar" method="get" role="search">
      <label class="prefix mono" for="busca-hero">
        github.com/
      </label>
      <input
        id="busca-hero"
        name="q"
        placeholder="login"
        autocomplete="off"
        spellcheck={false}
        required
        aria-describedby={error ? 'busca-erro' : undefined}
      />
      <button class="btn primary" type="submit">
        Gerar timeline
      </button>
    </form>
    {error && (
      <p class="form-error" id="busca-erro" role="alert">
        {error}
      </p>
    )}
    <p class="hint muted">
      Aceita <code>login</code>, <code>@login</code> e <code>https://github.com/login</code>.
    </p>
  </section>
);

/** Grade de contribuições decorativa e determinística (sem `Math.random`, para o SSR ser estável). */
const DecorativeGrid: FC = () => (
  <div class="deco-grid" aria-hidden="true">
    {Array.from({ length: 7 * 30 }, (_, index) => (
      <i class={`l${(index * 7 + (index % 11) * 3) % 5}`} />
    ))}
  </div>
);

const BadgeSection: FC = () => {
  const badge = `${CANONICAL_ORIGIN}/badge/${BADGE_EXAMPLE_LOGIN}.svg`;
  return (
    <section class="badge-section" id="badge" aria-labelledby="badge-titulo">
      <h2 id="badge-titulo">Badge para o seu README</h2>
      <p class="muted">Troque o login no snippet. O badge se atualiza junto com a timeline.</p>
      <img
        src={`/badge/${BADGE_EXAMPLE_LOGIN}.svg`}
        alt="Exemplo de badge da Timeline"
        height="28"
      />
      <CopyField
        id="badge-exemplo"
        label="Markdown"
        value={`[![Timeline](${badge})](${CANONICAL_ORIGIN}/u/${BADGE_EXAMPLE_LOGIN})`}
      />
    </section>
  );
};
