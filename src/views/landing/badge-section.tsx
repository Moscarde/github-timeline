import { viewText, useLocale } from '../../i18n/view.js';
import type { FC } from 'hono/jsx';
import { CANONICAL_ORIGIN } from '../../config.js';
import { BadgePreview } from '../badge-preview.js';

const PLACEHOLDER = 'seu-usuario';

/** Seção "Leve sua timeline para o README": prévia do badge e snippet copiável. */
export const BadgeSection: FC = () => {
  const badge = `${CANONICAL_ORIGIN}/badge/`;
  const page = `${CANONICAL_ORIGIN}/u/`;
  const placeholder = viewText(PLACEHOLDER);
  const language = `?lang=${useLocale()}`;
  const snippet = `[![GitHub Timeline](${badge}${placeholder}.svg${language})](${page}${placeholder}${language})`;
  return (
    <section class="badge-section wrap" id="badge" aria-labelledby="badge-titulo">
      <div class="badge-copy">
        <h2 id="badge-titulo">{viewText('Leve sua timeline para o README')}</h2>
        <p class="muted">
          {viewText(
            'Um badge que atualiza sozinho e leva visitantes direto para a sua linha do tempo.',
          )}
        </p>
        <BadgePreview value="2019–2026 · 83 repos" />
      </div>
      <div class="code-panel">
        <div class="code-panel-head muted">
          <span>README.md</span>
          <button class="chip copy-chip" type="button" data-copy-text={snippet}>
            {viewText('Copiar')}
          </button>
        </div>
        <code class="mono muted code-panel-body">
          [![GitHub Timeline](
          <span class="str">
            {badge}
            <span class="ink">{placeholder}</span>.svg{language}
          </span>
          )](
          <span class="str">
            {page}
            <span class="ink">{placeholder}</span>
            {language}
          </span>
          )
        </code>
      </div>
    </section>
  );
};
