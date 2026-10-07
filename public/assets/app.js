// GitHub Timeline — JS mínimo do cliente (§7): tema, copiar, abas, paginação e progresso da coleta.

const CLIENT_MESSAGES = JSON.parse(document.body.dataset.messages ?? '{}');

/** Client feedback uses the same translation catalog as the rendered page. */
function clientText(source) {
  return CLIENT_MESSAGES[source] ?? source;
}

const THEME_COOKIE = 'tema';
const ONE_YEAR = 60 * 60 * 24 * 365;
const COPIED_MS = 1800;
const STAGE_ORDER = ['perfil', 'repositorios', 'contribuicoes', 'conquistas'];

/** @returns {'escuro' | 'claro'} */
function effectiveTheme() {
  const attr = document.documentElement.dataset.theme;
  if (attr === 'dark') return 'escuro';
  if (attr === 'light') return 'claro';
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
}

/** @param {'escuro' | 'claro'} theme */
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme === 'escuro' ? 'dark' : 'light';
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
  syncShareTheme(theme);
}

/**
 * Troca `tema=` numa URL, inclusive dentro do parâmetro `url` dos links de X e LinkedIn.
 * @param {string} href
 * @param {'escuro' | 'claro'} theme
 */
function withTheme(href, theme) {
  const url = new URL(href, location.origin);
  if (url.searchParams.has('tema')) url.searchParams.set('tema', theme);
  const inner = url.searchParams.get('url');
  if (inner) url.searchParams.set('url', withTheme(inner, theme));
  return url.origin === location.origin && href.startsWith('/')
    ? url.pathname + url.search
    : url.toString();
}

/** "Baixar card", "Compartilhar" e "Copiar link" seguem o tema ativo na página (§5.1). */
function syncShareTheme(theme) {
  for (const link of document.querySelectorAll('[data-share]'))
    link.href = withTheme(link.getAttribute('href'), theme);
  for (const button of document.querySelectorAll('[data-share-link]'))
    button.dataset.copyText = withTheme(button.dataset.copyText, theme);
}

/** @param {HTMLElement} button @param {string} text */
async function copyText(button, text) {
  button.dataset.label ??= button.textContent;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = button.dataset.copiedLabel ?? clientText('Copiado ✓');
  } catch {
    button.textContent = clientText('Selecione e copie');
  }
  clearTimeout(Number(button.dataset.timer));
  button.dataset.timer = String(
    setTimeout(() => (button.textContent = button.dataset.label), COPIED_MS),
  );
}

function onClick(event) {
  const target = event.target instanceof Element ? event.target.closest('button') : null;
  if (!target) return;
  if (target.matches('[data-theme-toggle]'))
    applyTheme(effectiveTheme() === 'escuro' ? 'claro' : 'escuro');
  else if (target.dataset.copyText) copyText(target, target.dataset.copyText);
  else if (target.dataset.tab) selectTab(target);
  else if (target.matches('[data-toggle-repos]')) toggleRepos(target);
  else if (target.matches('[data-more-eras]')) showAllEras(target);
}

/** Abas da galeria (WAI-ARIA tabs): um painel visível por vez. */
function selectTab(tab) {
  for (const other of tab.parentElement.querySelectorAll('[role="tab"]')) {
    const selected = other === tab;
    other.setAttribute('aria-selected', String(selected));
    document.getElementById(other.getAttribute('aria-controls')).hidden = !selected;
  }
}

/** @param {HTMLElement} button */
function toggleRepos(button) {
  const more = button.previousElementSibling;
  if (!more) return;
  more.hidden = !more.hidden;
  button.setAttribute('aria-expanded', String(!more.hidden));
  button.dataset.label ??= button.textContent;
  button.textContent = more.hidden ? button.dataset.label : clientText('Mostrar menos');
}

/** @param {HTMLElement} button */
function showAllEras(button) {
  const hidden = [...document.querySelectorAll('[data-era][hidden]')];
  hidden.forEach((era) => (era.hidden = false));
  hidden[0]?.querySelector('.mo')?.focus();
  button.closest('.more-eras-row')?.remove();
}

/** Perfil novo: acompanha a coleta por SSE e recarrega quando o snapshot fica pronto (§6). */
function watchCollection(container) {
  const username = container.dataset.collecting;
  const source = new EventSource(`/api/status/${encodeURIComponent(username)}`);
  const done = new Set();
  const finish = () => {
    source.close();
    location.reload();
  };
  source.addEventListener('progress', (event) => {
    const { stage, account } = JSON.parse(event.data);
    markStage(container, done, stage);
    if (account) fillHeader(container, account);
  });
  source.addEventListener('done', finish);
  source.addEventListener('not_found', finish);
  source.addEventListener('failed', () => {
    source.close();
    showRetry(container);
  });
  source.addEventListener('idle', () => {
    source.close();
    showRetry(container);
  });
}

/** Repositórios e contribuições chegam em paralelo; "conquistas" fecha todas as etapas. */
function markStage(container, done, stage) {
  if (stage === 'conquistas') STAGE_ORDER.forEach((name) => done.add(name));
  else done.add(stage);
  const active = STAGE_ORDER.find((name) => !done.has(name));
  for (const item of container.querySelectorAll('[data-stage]')) {
    item.classList.toggle('done', done.has(item.dataset.stage));
    item.classList.toggle('active', item.dataset.stage === active);
  }
  const bar = container.querySelector('[data-progress]');
  if (bar) bar.style.width = `${Math.max(6, (done.size / STAGE_ORDER.length) * 100)}%`;
}

/** Troca o skeleton pelo cabeçalho real assim que `/users` responde. */
function fillHeader(container, account) {
  const header = container.querySelector('[data-pending-header]');
  if (!header) return;
  const avatar = document.createElement('img');
  avatar.className = 'avatar';
  avatar.alt = '';
  avatar.width = avatar.height = 72;
  avatar.src = `${account.avatarUrl}${account.avatarUrl.includes('?') ? '&' : '?'}s=144`;
  header.querySelector('[data-pending-avatar]')?.replaceWith(avatar);
  const name = header.querySelector('[data-pending-name]');
  if (name) name.textContent = account.name || account.username;
  header.removeAttribute('data-pending-header');
}

function showRetry(container) {
  const note = document.createElement('p');
  note.className = 'muted';
  note.textContent = clientText('A coleta não terminou. Recarregue a página para tentar de novo.');
  container.querySelector('.steps-panel')?.append(note);
}

/** Cota esgotada sem snapshot (S4): a página tenta de novo sozinha. */
function scheduleRetry(element) {
  const seconds = Number(element.dataset.retryIn);
  if (seconds > 0) setTimeout(() => location.reload(), seconds * 1000);
}

document.addEventListener('click', onClick);
syncShareTheme(effectiveTheme());
const collecting = document.querySelector('[data-collecting]');
if (collecting) watchCollection(collecting);
const retry = document.querySelector('[data-retry-in]');
if (retry) scheduleRetry(retry);

/** Submit the native form immediately when JavaScript is available. */
function onLanguageChange(event) {
  if (event.target instanceof HTMLSelectElement && event.target.matches('[data-language-select]'))
    event.target.form?.requestSubmit();
}

document.addEventListener('change', onLanguageChange);
