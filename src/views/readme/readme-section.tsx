import { createContext, useContext, type FC } from 'hono/jsx';
import { ACHIEVEMENT_IDS } from '../../domain/achievements.js';
import { useLocale, viewMessage, viewText } from '../../i18n/view.js';
import { BadgePreview } from '../badge-preview.js';
import {
  README_ITEMS,
  SHARED_OPTIONS,
  badgeSnippet,
  embedSnippet,
  type ReadmeItem,
  type ReadmeOption,
  type ReadmeSetting,
} from './readme-snippets.js';

const PLACEHOLDER = 'seu-usuario';

/** Perfil da página da timeline: a seção já abre com o usuário e as prévias reais. */
export interface ReadmeProfile {
  username: string;
  /** `generatedAt` do snapshot: força o navegador a buscar a imagem nova a cada coleta. */
  version: string;
}

/** Na landing é `null` e a seção começa no perfil de exemplo. */
const ProfileContext = createContext<ReadmeProfile | null>(null);

/**
 * Seção "Leve sua timeline para o README": título e explicação em cima, prévia e código lado a
 * lado. O visitante digita o usuário e escolhe as conquistas; o script `readme-builder.js`
 * preenche os modelos `data-*` que o servidor deixa prontos. Na página do perfil (`profile`),
 * tudo já abre com o usuário da página.
 * @example <ReadmeSection profile={{ username: 'octocat', version: snapshot.generatedAt }} />
 */
export const ReadmeSection: FC<{ profile?: ReadmeProfile }> = ({ profile }) => {
  const id = profile ? 'readme' : 'badge';
  return (
    <ProfileContext.Provider value={profile ?? null}>
      <section
        class="readme-section wrap"
        id={id}
        aria-labelledby={`${id}-titulo`}
        data-readme-builder=""
        data-placeholder={viewText(PLACEHOLDER)}
        data-username={profile?.username}
        data-version={profile?.version}
      >
        <ReadmeHead titleId={`${id}-titulo`} />
        {README_ITEMS.map((item, index) => (
          <ReadmeItemBlock item={item} first={index === 0} />
        ))}
        <script type="module" src="/assets/readme-builder.js"></script>
      </section>
    </ProfileContext.Provider>
  );
};

/** Instrução única e as opções que valem para todos os formatos, ditas uma vez só. */
const ReadmeHead: FC<{ titleId: string }> = ({ titleId }) => {
  const profile = useContext(ProfileContext);
  return (
    <div class="readme-head">
      <h2 id={titleId}>{viewText('Leve sua timeline para o README')}</h2>
      <p class="muted">
        {profile
          ? viewMessage(
              'Prévias com os dados de @{0}. Copie o código e cole no seu README; as imagens se atualizam sozinhas.',
              [profile.username],
            )
          : viewText(
              'Digite seu usuário para ver as prévias com os seus dados, copie o código e cole no seu README. As imagens se atualizam sozinhas.',
            )}
      </p>
      <OptionList options={SHARED_OPTIONS} />
    </div>
  );
};

/**
 * Troca o placeholder pelo usuário da página, quando houver; na landing devolve o modelo.
 * @example withProfile('/embed/seu-usuario/trilha.svg') // "/embed/octocat/trilha.svg"
 */
function withProfile(template: string): string {
  const profile = useContext(ProfileContext);
  return profile ? template.split(viewText(PLACEHOLDER)).join(profile.username) : template;
}

/** Endereço de prévia do perfil real, com a versão do snapshot para furar o cache. */
function liveSrc(template: string): string {
  const profile = useContext(ProfileContext);
  return profile ? `${withProfile(template)}&v=${encodeURIComponent(profile.version)}` : template;
}

const ReadmeItemBlock: FC<{ item: ReadmeItem; first: boolean }> = ({ item, first }) => (
  <article
    class={`readme-item readme-item-${item.id}`}
    id={`readme-${item.id}`}
    data-kind={item.id}
    aria-labelledby={`readme-${item.id}-titulo`}
  >
    <div class="readme-panel-copy">
      <h3 id={`readme-${item.id}-titulo`}>{viewText(item.label)}</h3>
      <p class="muted">{viewText(item.description)}</p>
      {item.options.length > 0 && <OptionList options={item.options} />}
      {item.id === 'conquistas' && <AchievementToggles />}
    </div>
    <div class="readme-item-body">
      <ReadmePreview item={item} />
      <div class="readme-code-column" data-readme-code="">
        <UsernameField id={item.id} announce={first} />
        {item.settings?.map((setting) => (
          <SettingSelect kind={item.id} setting={setting} />
        ))}
        <SnippetPanel snippet={snippetFor(item)} />
      </div>
    </div>
  </article>
);

/**
 * Campo de usuário de cada formato; o script mantém todos com o mesmo valor. Só o status do
 * primeiro é anunciado, para leitores de tela não repetirem a mesma frase quatro vezes.
 */
const UsernameField: FC<{ id: string; announce: boolean }> = ({ id, announce }) => (
  <div class="readme-field readme-user">
    <label for={`readme-user-${id}`}>{viewText('Seu usuário do GitHub')}</label>
    <input
      id={`readme-user-${id}`}
      class="mono"
      type="text"
      inputmode="text"
      autocomplete="off"
      autocapitalize="off"
      spellcheck={false}
      placeholder={viewText(PLACEHOLDER)}
      value={useContext(ProfileContext)?.username}
      data-readme-user=""
    />
    <p class="readme-status muted" data-readme-status="" aria-live={announce ? 'polite' : 'off'} />
  </div>
);

/**
 * Prévia: começa no perfil de exemplo e passa para o perfil digitado quando ele existe. Duas
 * imagens, uma por tema, e o CSS mostra a do tema ativo.
 */
const ReadmePreview: FC<{ item: ReadmeItem }> = ({ item }) => {
  const locale = useLocale();
  if (item.id === 'badge') return <BadgeSlot />;
  const alt = viewText(item.alt);
  const image = (theme: 'escuro' | 'claro', className: string) => {
    const query = `?lang=${locale}&tema=${theme}`;
    const example = `/exemplos/${item.id}.svg${query}`;
    const live = `/embed/${viewText(PLACEHOLDER)}/${item.id}.svg${query}`;
    return (
      <img
        class={className}
        src={useContext(ProfileContext) ? liveSrc(live) : example}
        alt={alt}
        width="840"
        loading="lazy"
        data-example={example}
        data-live={live}
      />
    );
  };
  return (
    <div class="readme-preview">
      {image('escuro', 'only-dark')}
      {image('claro', 'only-light')}
    </div>
  );
};

/** O badge de exemplo é HTML (sem perfil); com usuário, vira o SVG real. */
const BadgeSlot: FC = () => {
  const profile = useContext(ProfileContext);
  const live = `/badge/${viewText(PLACEHOLDER)}.svg?lang=${useLocale()}`;
  return (
    <div class="readme-preview readme-preview-badge">
      <span data-badge-example="" hidden={Boolean(profile)}>
        <BadgePreview value="2019–2026 · 83 repos" />
      </span>
      <img
        alt="GitHub Timeline"
        hidden={!profile}
        src={profile ? liveSrc(live) : undefined}
        data-badge-live={live}
      />
    </div>
  );
};

const OptionList: FC<{ options: readonly ReadmeOption[] }> = ({ options }) => (
  <dl class="readme-options">
    {options.map((option) => (
      <div>
        <dt>
          <code class="mono">{option.code}</code>
        </dt>
        <dd class="muted">{viewText(option.text)}</dd>
      </div>
    ))}
  </dl>
);

/**
 * Ajuste da URL (paleta, estilo) ao lado do campo de usuário. A primeira opção é a padrão e
 * fica fora do endereço; a prévia acima mostra o resultado.
 */
const SettingSelect: FC<{ kind: string; setting: ReadmeSetting }> = ({ kind, setting }) => (
  <div class="readme-field">
    <label for={`readme-${setting.param}-${kind}`}>{viewText(setting.label)}</label>
    <select
      id={`readme-${setting.param}-${kind}`}
      data-setting-for={kind}
      data-param={setting.param}
    >
      {setting.options.map((option) => (
        <option value={option.id}>{viewText(option.label)}</option>
      ))}
    </select>
  </div>
);

/**
 * Caixas de seleção com os ids: marcadas entram no embed. Sem JavaScript, servem de lista dos
 * ids aceitos no endereço.
 */
const AchievementToggles: FC = () => (
  <fieldset class="readme-ids">
    <legend class="muted">{viewText('Marque as conquistas que entram no embed:')}</legend>
    {ACHIEVEMENT_IDS.map((id) => (
      <label class="readme-id mono">
        <input class="sr-only" type="checkbox" checked data-achievement-id={id} />
        <span class="readme-check" aria-hidden="true" />
        {id}
      </label>
    ))}
  </fieldset>
);

/** Código com o placeholder destacado; o botão copia o texto puro. */
const SnippetPanel: FC<{ snippet: string }> = ({ snippet }) => {
  const placeholder = viewText(PLACEHOLDER);
  const user = useContext(ProfileContext)?.username ?? placeholder;
  const parts = snippet.split(placeholder);
  return (
    <div class="code-panel readme-code-panel">
      <div class="code-panel-head muted">
        <span>README.md</span>
        <button class="chip copy-chip" type="button" data-copy-text={withProfile(snippet)}>
          {viewText('Copiar')}
        </button>
      </div>
      <code class="mono muted code-panel-body readme-code" data-template={snippet}>
        {parts.map((part, index) => (
          <>
            {part}
            {index < parts.length - 1 && <span class="ink">{user}</span>}
          </>
        ))}
      </code>
    </div>
  );
};

function snippetFor(item: ReadmeItem): string {
  const username = viewText(PLACEHOLDER);
  const locale = useLocale();
  if (item.id === 'badge') return badgeSnippet(username, locale);
  return embedSnippet({ kind: item.id, username, locale, alt: viewText(item.alt) });
}
