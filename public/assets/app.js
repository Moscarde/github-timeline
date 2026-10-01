// Timeline v2 — JS mínimo do cliente (§7): tema, copiar, abas de anos/repos e progresso da coleta.

const THEME_COOKIE = 'tema';
const ONE_YEAR = 60 * 60 * 24 * 365;

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
  return url.origin === location.origin && href.startsWith('/') ? url.pathname + url.search : url.toString();
}

/** "Baixar card" e "Compartilhar" seguem o tema ativo na página (§5.1). */
function syncShareTheme(theme) {
  for (const link of document.querySelectorAll('[data-share]')) link.href = withTheme(link.getAttribute('href'), theme);
  for (const button of document.querySelectorAll('[data-share-link]')) button.dataset.copyText = withTheme(button.dataset.copyText, theme);
  const pageInput = document.getElementById('url-perfil');
  if (pageInput) pageInput.value = withTheme(pageInput.value, theme);
}

/** @param {HTMLElement} button @param {string} text */
async function copyText(button, text) {
  const label = button.textContent;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = 'Copiado';
  } catch {
    button.textContent = 'Selecione e copie';
  }
  setTimeout(() => (button.textContent = label), 1600);
}

function onClick(event) {
  const target = event.target instanceof Element ? event.target.closest('button') : null;
  if (!target) return;
  if (target.matches('[data-theme-toggle]')) applyTheme(effectiveTheme() === 'escuro' ? 'claro' : 'escuro');
  else if (target.dataset.copy) copyText(target, document.getElementById(target.dataset.copy)?.value ?? '');
  else if (target.dataset.copyText) copyText(target, target.dataset.copyText);
  else if (target.matches('[data-toggle-repos]')) toggleRepos(target);
  else if (target.matches('[data-more-eras]')) showAllEras(target);
}

/** @param {HTMLElement} button */
function toggleRepos(button) {
  const more = button.previousElementSibling;
  if (!more) return;
  more.hidden = !more.hidden;
  button.setAttribute('aria-expanded', String(!more.hidden));
  button.dataset.label ??= button.textContent;
  button.textContent = more.hidden ? button.dataset.label : 'Mostrar menos';
}

/** @param {HTMLElement} button */
function showAllEras(button) {
  const hidden = [...document.querySelectorAll('[data-era][hidden]')];
  hidden.forEach((era) => (era.hidden = false));
  hidden[0]?.querySelector('.mo')?.focus();
  button.remove();
}

/** Perfil novo: acompanha a coleta por SSE e recarrega quando o snapshot fica pronto (§6). */
function watchCollection(container) {
  const login = container.dataset.collecting;
  const source = new EventSource(`/api/status/${encodeURIComponent(login)}`);
  const finish = () => { source.close(); location.reload(); };
  source.addEventListener('progress', (event) => {
    const { stage, account } = JSON.parse(event.data);
    markStage(container, stage);
    if (account) fillHeader(container, account);
  });
  source.addEventListener('done', finish);
  source.addEventListener('not_found', finish);
  source.addEventListener('failed', () => { source.close(); showRetry(container); });
  source.addEventListener('idle', () => { source.close(); showRetry(container); });
}

function markStage(container, stage) {
  let reached = false;
  for (const item of [...container.querySelectorAll('[data-stage]')].reverse()) {
    if (item.dataset.stage === stage) reached = true;
    item.classList.toggle('done', reached);
  }
}

/** Troca o skeleton pelo cabeçalho real assim que `/users` responde. */
function fillHeader(container, account) {
  const header = container.querySelector('[data-pending-header]');
  if (!header) return;
  const avatar = document.createElement('img');
  avatar.className = 'avatar';
  avatar.alt = '';
  avatar.src = `${account.avatarUrl}${account.avatarUrl.includes('?') ? '&' : '?'}s=176`;
  header.querySelector('[data-pending-avatar]')?.replaceWith(avatar);
  const name = header.querySelector('[data-pending-name]');
  const login = header.querySelector('[data-pending-login]');
  if (name) { name.className = ''; name.textContent = account.name || account.login; }
  if (login) { login.className = 'login mono'; login.textContent = `@${account.login}`; }
  header.removeAttribute('aria-busy');
  header.removeAttribute('data-pending-header');
}

function showRetry(container) {
  const note = document.createElement('p');
  note.textContent = 'A coleta não terminou. Recarregue a página para tentar de novo.';
  container.append(note);
}

document.addEventListener('click', onClick);
syncShareTheme(effectiveTheme());
const collecting = document.querySelector('[data-collecting]');
if (collecting) watchCollection(collecting);
