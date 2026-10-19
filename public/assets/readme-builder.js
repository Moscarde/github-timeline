// Montador de embeds da landing: usuário e conquistas escolhidos atualizam prévias e código.
import {
  fillTemplate,
  parseUsername,
  selectionSegment,
  toggleAchievement,
} from './readme-builder-core.js';

const DEBOUNCE_MS = 600;
const MESSAGES = JSON.parse(document.body.dataset.messages ?? '{}');

/** @param {string} source @param {string} [value] */
function text(source, value = '') {
  return (MESSAGES[source] ?? source).replace('{0}', value);
}

const section = document.querySelector('[data-readme-builder]');
if (section) start(section);

/** @param {HTMLElement} root */
function start(root) {
  const allIds = [...root.querySelectorAll('[data-achievement-id]')].map(
    (button) => button.dataset.achievementId,
  );
  const state = { root, allIds, selected: [...allIds], settings: initialSettings(root) };
  // Na página do perfil a seção já chega com usuário e prévias reais.
  const { username = null, version = null } = root.dataset;
  Object.assign(state, { username, version, request: 0 });
  let timer = 0;
  root.addEventListener('input', (event) => {
    if (!event.target.matches('[data-readme-user]')) return;
    syncInputs(root, event.target);
    clearTimeout(timer);
    timer = setTimeout(() => onUsername(state, event.target.value), DEBOUNCE_MS);
  });
  root.addEventListener('change', (event) => {
    if (event.target.matches?.('[data-setting-for]')) onSetting(state, event.target);
    else onToggle(state, event);
  });
  render(state);
}

/** Todos os campos mostram o mesmo usuário, qualquer que seja o editado. */
function syncInputs(root, source) {
  for (const input of root.querySelectorAll('[data-readme-user]'))
    if (input !== source) input.value = source.value;
}

/**
 * Ajustes de cada embed (`paleta`, `estilo`): a primeira opção de cada select é a padrão, que
 * não vai para o endereço.
 * @returns {Record<string, Record<string, { current: string, fallback: string }>>}
 */
function initialSettings(root) {
  const settings = {};
  // `value` em vez da primeira opção: o navegador pode restaurar a escolha ao recarregar.
  for (const select of root.querySelectorAll('select[data-setting-for]')) {
    const kind = (settings[select.dataset.settingFor] ??= {});
    kind[select.dataset.param] = { current: select.value, fallback: select.options[0].value };
  }
  return settings;
}

function onSetting(state, select) {
  const setting = state.settings[select.dataset.settingFor]?.[select.dataset.param];
  if (!setting) return;
  setting.current = select.value;
  render(state);
}

/** Ajustes fora do padrão do embed a que o elemento pertence, prontos para a URL. */
function paramsOf(state, element) {
  const settings = state.settings[element.closest('[data-kind]')?.dataset.kind] ?? {};
  return Object.fromEntries(
    Object.entries(settings)
      .filter(([, setting]) => setting.current !== setting.fallback)
      .map(([param, setting]) => [param, setting.current]),
  );
}

/** A última conquista marcada não desmarca: `render` devolve o ✓ à caixa. */
function onToggle(state, event) {
  const checkbox = event.target;
  if (!checkbox.matches?.('[data-achievement-id]')) return;
  state.selected = toggleAchievement(state.selected, checkbox.dataset.achievementId);
  render(state);
}

/** Valida, atualiza o código na hora e só troca as prévias quando o perfil existir. */
async function onUsername(state, raw) {
  const parsed = parseUsername(raw);
  const request = ++state.request;
  state.version = null;
  if (parsed.status !== 'ok') {
    state.username = null;
    setStatus(
      state.root,
      parsed.status === 'invalid' ? text('Username inválido: "{0}".', parsed.received) : '',
    );
    return render(state);
  }
  state.username = parsed.username;
  render(state);
  setStatus(state.root, text('Gerando a timeline de @{0}…', parsed.username));
  const outcome = await loadProfile(parsed.username);
  if (request !== state.request) return;
  state.version = outcome.version;
  setStatus(state.root, outcome.message);
  render(state);
}

/** `/api/profile` espera a coleta: quando responde, o embed já sai pronto, sem aviso. */
async function loadProfile(username) {
  try {
    const response = await fetch(`/api/profile/${encodeURIComponent(username)}`);
    if (response.ok) return { version: (await response.json()).generatedAt, message: '' };
    if (response.status === 404)
      return { version: null, message: text('Perfil @{0} não encontrado.', username) };
    if (response.status === 429)
      return {
        version: null,
        message: text('Muitas timelines novas daqui. Tente de novo em alguns minutos.'),
      };
    return {
      version: null,
      message: text('GitHub indisponível agora. Tente de novo em alguns minutos.'),
    };
  } catch {
    return {
      version: null,
      message: text('GitHub indisponível agora. Tente de novo em alguns minutos.'),
    };
  }
}

function setStatus(root, message) {
  for (const status of root.querySelectorAll('[data-readme-status]')) status.textContent = message;
}

function render(state) {
  const values = {
    placeholder: state.root.dataset.placeholder,
    username: state.username,
    selection: selectionSegment(state.selected, state.allIds),
  };
  for (const code of state.root.querySelectorAll('[data-template]'))
    renderCode(code, { ...values, params: paramsOf(state, code) });
  for (const image of state.root.querySelectorAll('[data-example]'))
    renderPreview(image, { ...values, params: paramsOf(state, image) }, state.version);
  for (const checkbox of state.root.querySelectorAll('[data-achievement-id]'))
    checkbox.checked = state.selected.includes(checkbox.dataset.achievementId);
  renderBadge(state.root, values, state.version);
}

/** Código visível com o usuário destacado; o botão de copiar recebe o texto puro. */
function renderCode(code, values) {
  const snippet = fillTemplate(code.dataset.template, values);
  const user = values.username ?? values.placeholder;
  // Divide o modelo, não o snippet pronto: um usuário como "a" casaria com o resto do texto.
  const parts = code.dataset.template
    .split(values.placeholder)
    .map((part) => fillTemplate(part, { ...values, username: null }));
  code.replaceChildren(
    ...parts.flatMap((part, index) => (index === 0 ? [part] : [mark(user), part])),
  );
  const copy = code.closest('[data-readme-code]')?.querySelector('[data-copy-text]');
  if (copy) copy.dataset.copyText = snippet;
}

function mark(value) {
  const span = document.createElement('span');
  span.className = 'ink';
  span.textContent = value;
  return span;
}

/** Sem perfil pronto, a prévia continua no exemplo (com a seleção de conquistas aplicada). */
function renderPreview(image, values, version) {
  const live = version && values.username;
  const src = live
    ? `${fillTemplate(image.dataset.live, values)}&v=${encodeURIComponent(version)}`
    : fillTemplate(image.dataset.example, values);
  if (image.getAttribute('src') !== src) image.src = src;
}

function renderBadge(root, values, version) {
  const live = root.querySelector('[data-badge-live]');
  const example = root.querySelector('[data-badge-example]');
  if (!live || !example) return;
  const ready = Boolean(version && values.username);
  if (ready)
    live.src = `${fillTemplate(live.dataset.badgeLive, values)}&v=${encodeURIComponent(version)}`;
  live.hidden = !ready;
  example.hidden = ready;
}
