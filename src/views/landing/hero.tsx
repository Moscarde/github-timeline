import type { FC } from 'hono/jsx';
import { formatInteger } from '../../domain/format.js';
import { decorativeLevel, seededRandom } from '../decorative.js';
import { CompareForm } from '../compare-form.js';

const GRID_COLUMNS = 34;
const GRID_ROWS = 7;

/** Hero da landing (§2.1): contador semanal, busca e atalho para comparar. */
export const Hero: FC<{ weeklyCount: number; error?: string }> = ({ weeklyCount, error }) => (
  <section class="hero">
    <HeroGrid />
    <div class="hero-fade" aria-hidden="true" />
    <div class="hero-body wrap">
      {weeklyCount > 0 && (
        <p class="live-pill">
          <span class="live-dot" aria-hidden="true" />
          <span>
            {formatInteger(weeklyCount)}
            <span class="live-long"> timelines geradas</span> esta semana
          </span>
        </p>
      )}
      <h1>
        Todo commit conta uma história. <span class="ink">Veja a sua.</span>
      </h1>
      <p class="hero-lead muted">
        Digite um usuário do GitHub. Montamos a trajetória ano a ano
        <span class="hero-lead-long">
          {' '}
          a partir dos repositórios públicos: linguagens, topics, stars e marcos
        </span>
        .
      </p>
      <SearchForm error={error} />
      {error && (
        <p class="form-error" id="busca-erro" role="alert">
          {error}
        </p>
      )}
      <CompareForm id="comparar" lead="Ou compare dois perfis:" />
    </div>
  </section>
);

const SearchForm: FC<{ error?: string }> = ({ error }) => (
  <form class="hero-search" id="gerar" action="/buscar" method="get" role="search">
    <label class="hero-input mono">
      <span class="faint">github.com/</span>
      <input
        name="q"
        placeholder="seu-usuario"
        autocomplete="off"
        spellcheck={false}
        required
        aria-label="Usuário do GitHub"
        aria-describedby={error ? 'busca-erro' : undefined}
      />
    </label>
    <button class="hero-submit" type="submit">
      Gerar timeline →
    </button>
  </form>
);

/** Grade decorativa inclinada; a intensidade e a opacidade crescem para a direita. */
const HeroGrid: FC = () => {
  const next = seededRandom(7);
  const cells = [];
  for (let column = 0; column < GRID_COLUMNS; column++) {
    for (let row = 0; row < GRID_ROWS; row++) {
      const opacity = Math.min(1, 0.25 + column / 30).toFixed(2);
      const level = decorativeLevel(next, column / 60);
      cells.push(<i class={`l${level}`} style={`opacity:${opacity}`} />);
    }
  }
  return (
    <div class="hero-grid" aria-hidden="true">
      {cells}
    </div>
  );
};
