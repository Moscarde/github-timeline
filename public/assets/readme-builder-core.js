// Regras puras do montador de embeds da landing: sem DOM, testadas no vitest.

/** Mesma regra de `src/domain/username.ts`: 1–39 caracteres, hífens só no meio. */
const USERNAME_PATTERN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const PROFILE_URL_PATTERN = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/?#\s]+)\/?(?:[?#].*)?$/i;
/** Trecho dos modelos trocado pela seleção de conquistas. */
const ALL_ACHIEVEMENTS_PATH = '/conquistas.svg';

/**
 * Lê o campo de usuário como a busca da landing: aceita `user`, `@user` e a URL do perfil.
 * @param {string} raw
 * @returns {{ status: 'empty' } | { status: 'invalid', received: string } | { status: 'ok', username: string }}
 * @example parseUsername('@octocat') // { status: 'ok', username: 'octocat' }
 */
export function parseUsername(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return { status: 'empty' };
  const candidate = (PROFILE_URL_PATTERN.exec(trimmed)?.[1] ?? trimmed).replace(/^@/, '');
  if (!USERNAME_PATTERN.test(candidate)) return { status: 'invalid', received: trimmed };
  return { status: 'ok', username: candidate };
}

/**
 * Trecho do endereço com as conquistas ligadas, na ordem do catálogo. Todas ligadas usa o
 * endereço curto (`null`), que continua mostrando conquistas novas se o catálogo crescer.
 * @param {readonly string[]} selected
 * @param {readonly string[]} all
 * @returns {string | null}
 * @example selectionSegment(['poliglota'], ['primeiro-repo', 'poliglota']) // "poliglota"
 */
export function selectionSegment(selected, all) {
  const ordered = all.filter((id) => selected.includes(id));
  return ordered.length === all.length ? null : ordered.join(',');
}

/**
 * Preenche um modelo do servidor (snippet ou endereço de prévia) com o usuário, a seleção de
 * conquistas e os ajustes da URL (`paleta`, `estilo`). Os modelos sempre têm `.svg?lang=`, então
 * os ajustes entram logo após o `?`; ajustes no valor padrão não vão para o endereço.
 * @param {string} template
 * @param {{ placeholder: string, username: string | null, selection: string | null, params?: Record<string, string> }} values
 * @returns {string}
 * @example fillTemplate('/embed/seu-usuario/trilha.svg?lang=en', { placeholder: 'seu-usuario', username: 'ana', selection: null, params: { estilo: 'compacto' } })
 * // "/embed/ana/trilha.svg?estilo=compacto&lang=en"
 */
export function fillTemplate(template, { placeholder, username, selection, params = {} }) {
  const withUser = template.split(placeholder).join(username ?? placeholder);
  const query = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}&`)
    .join('');
  const withParams = query ? withUser.split('.svg?').join(`.svg?${query}`) : withUser;
  if (!selection) return withParams;
  return withParams.split(ALL_ACHIEVEMENTS_PATH).join(`/conquistas/${selection}.svg`);
}

/**
 * Liga ou desliga uma conquista, sem deixar a seleção vazia (o endereço precisa de um id).
 * @param {readonly string[]} selected
 * @param {string} id
 * @returns {string[]}
 * @example toggleAchievement(['a', 'b'], 'a') // ["b"]
 */
export function toggleAchievement(selected, id) {
  if (!selected.includes(id)) return [...selected, id];
  if (selected.length === 1) return [...selected];
  return selected.filter((current) => current !== id);
}
