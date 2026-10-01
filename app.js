/* GitHub Timeline — monta a linha do tempo de um perfil a partir da API pública do GitHub. */

const BASE = window.__BASE__ || '/';
const API = 'https://api.github.com';
const USER_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const CACHE_TTL = 30 * 60 * 1000;
const PER_YEAR = 6;
const MAX_PAGES = 10;

const app = document.getElementById('app');

/* ---------- utilidades ---------- */

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const fmtMonth = iso => { const d = new Date(iso); return `${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
const yearOf = iso => new Date(iso).getUTCFullYear();
const nf = new Intl.NumberFormat('pt-BR');
const plural = (n, one, many) => `${nf.format(n)} ${n === 1 ? one : many}`;
const joinPt = xs => xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' e ' + xs[xs.length - 1];

const store = {
  get(area, k) { try { return window[area].getItem(k); } catch { return null; } },
  set(area, k, v) { try { window[area].setItem(k, v); } catch {} },
  del(area, k) { try { window[area].removeItem(k); } catch {} }
};
const getToken = () => store.get('localStorage', 'ght-token') || '';

/* ---------- ícones (Octicons) ---------- */

const OCTO = '<svg class="octo" height="14" width="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.450-1.087a.25.25 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"></path></svg>';
const STAR = '<svg height="12" width="12" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path></svg>';
const FORK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"></path></svg>';
const FORK12 = FORK.replace('<svg ', '<svg height="12" width="12" ');
const LINK = '<svg height="12" width="12" viewBox="0 0 16 16" aria-hidden="true"><path d="m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a1.998 1.998 0 0 0 0 2.83Z"></path></svg>';

/* cores do GitHub Linguist para as linguagens mais comuns */
const LANG_COLORS = {
  'HTML':'#e34c26','CSS':'#563d7c','SCSS':'#c6538c','JavaScript':'#f1e05a','TypeScript':'#3178c6',
  'Python':'#3572A5','Jupyter Notebook':'#DA5B0B','Java':'#b07219','Kotlin':'#A97BFF','C':'#555555',
  'C++':'#f34b7d','C#':'#178600','Go':'#00ADD8','Rust':'#dea584','Ruby':'#701516','PHP':'#4F5D95',
  'Swift':'#F05138','Objective-C':'#438eff','Dart':'#00B4AB','Shell':'#89e051','PowerShell':'#012456',
  'Vue':'#41b883','Svelte':'#ff3e00','Astro':'#ff5a03','Elixir':'#6e4a7e','Erlang':'#B83998',
  'Haskell':'#5e5086','Scala':'#c22d40','Clojure':'#db5855','Lua':'#000080','R':'#198CE7',
  'Julia':'#a270ba','Perl':'#0298c3','Dockerfile':'#384d54','Makefile':'#427819','Nix':'#7e7eff',
  'Vim Script':'#199f4b','Emacs Lisp':'#c065db','TeX':'#3D6117','MDX':'#fcb32c','Handlebars':'#f7931e',
  'Assembly':'#6E4C13','Zig':'#ec915c','OCaml':'#ef7a08','F#':'#b845fc','Solidity':'#AA6746',
  'HCL':'#844FBA','Just':'#384d54','Groovy':'#4298b8','MATLAB':'#e16737','Elm':'#60B5CC'
};
const langColor = l => LANG_COLORS[l] || '#8b949e';

/* ---------- roteamento ---------- */

function parseUser() {
  const q = new URLSearchParams(location.search).get('u');
  if (q) return q.trim();
  let p = location.pathname;
  if (p.startsWith(BASE)) p = p.slice(BASE.length);
  const seg = p.split('/').filter(Boolean)[0] || '';
  return seg === 'index.html' || seg === '404.html' ? '' : decodeURIComponent(seg);
}

function go(user) {
  user = user.trim().replace(/^@/, '');
  if (!user) return;
  history.pushState(null, '', BASE + encodeURIComponent(user));
  route();
}

function route() {
  const user = parseUser();
  document.getElementById('slug-user').textContent = user || 'github';
  if (!user) return renderLanding();
  if (!USER_RE.test(user)) return renderError('Usuário inválido', `“${esc(user)}” não é um nome de usuário do GitHub válido.`);
  load(user);
}

/* ---------- coleta ---------- */

class ApiError extends Error {
  constructor(kind, message, extra = {}) { super(message); this.kind = kind; Object.assign(this, extra); }
}

async function gh(path, token) {
  const headers = { Accept: 'application/vnd.github+json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try { res = await fetch(API + path, { headers }); }
  catch { throw new ApiError('network', 'Falha de rede ao falar com a API do GitHub.'); }
  if (res.ok) return res.json();
  if (res.status === 404) throw new ApiError('notfound', 'Usuário não encontrado.');
  if (res.status === 401) throw new ApiError('auth', 'Token inválido ou expirado.');
  if ((res.status === 403 || res.status === 429) && res.headers.get('x-ratelimit-remaining') === '0') {
    const reset = Number(res.headers.get('x-ratelimit-reset')) * 1000;
    throw new ApiError('ratelimit', 'Limite de requisições da API atingido.', { reset });
  }
  throw new ApiError('http', `A API respondeu ${res.status}.`);
}

async function fetchRepos(user, token) {
  const all = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = await gh(`/users/${user}/repos?type=owner&sort=created&direction=asc&per_page=100&page=${page}`, token);
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

/* contribuições reais por mês (exige token): um alias de contributionsCollection por ano */
async function fetchContributions(user, token, fromYear, toYear) {
  const parts = [];
  for (let y = fromYear; y <= toYear; y++) {
    parts.push(`y${y}: contributionsCollection(from: "${y}-01-01T00:00:00Z", to: "${y}-12-31T23:59:59Z") {
      contributionCalendar { weeks { contributionDays { date contributionCount } } } }`);
  }
  const query = `query($login: String!) { user(login: $login) { ${parts.join('\n')} } }`;
  let res;
  try {
    res = await fetch(API + '/graphql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { login: user } })
    });
  } catch { throw new ApiError('network', 'Falha de rede ao buscar contribuições.'); }
  if (res.status === 401) throw new ApiError('auth', 'Token inválido ou expirado.');
  const json = await res.json();
  if (!res.ok || json.errors || !json.data?.user) throw new ApiError('http', 'Não foi possível ler as contribuições.');
  const out = {};
  for (let y = fromYear; y <= toYear; y++) {
    const row = Array(12).fill(0);
    for (const w of json.data.user[`y${y}`].contributionCalendar.weeks)
      for (const d of w.contributionDays)
        if (d.date.startsWith(String(y))) row[Number(d.date.slice(5, 7)) - 1] += d.contributionCount;
    out[y] = row;
  }
  return out;
}

async function fetchAll(user) {
  const token = getToken();
  const key = `ght:${user.toLowerCase()}:${token ? 't' : 'a'}`;
  const cached = store.get('sessionStorage', key);
  if (cached) {
    try { const c = JSON.parse(cached); if (Date.now() - c.at < CACHE_TTL) return c.data; } catch {}
  }

  const [profile, repos] = await Promise.all([gh(`/users/${user}`, token), fetchRepos(user, token)]);

  let contributions = null, contribError = null;
  if (token) {
    const nowY = new Date().getUTCFullYear();
    try { contributions = await fetchContributions(profile.login, token, yearOf(profile.created_at), nowY); }
    catch (e) { contribError = e.message; }
  }

  const slim = repos.map(r => ({
    name: r.name, url: r.html_url, description: r.description, language: r.language,
    topics: r.topics || [], stars: r.stargazers_count, forks: r.forks_count, fork: r.fork,
    archived: r.archived, homepage: r.homepage, size: r.size,
    created: r.created_at, pushed: r.pushed_at
  }));
  const data = {
    profile: {
      login: profile.login, name: profile.name, avatar: profile.avatar_url, bio: profile.bio,
      url: profile.html_url, created: profile.created_at, publicRepos: profile.public_repos,
      followers: profile.followers, type: profile.type
    },
    repos: slim, contributions, contribError, truncated: repos.length >= MAX_PAGES * 100
  };
  if (!contribError) store.set('sessionStorage', key, JSON.stringify({ at: Date.now(), data }));
  return data;
}

/* ---------- derivação a partir dos metadados ---------- */

function score(r) {
  return r.stars * 3 + r.forks * 2 + (r.description ? 2 : 0) + r.topics.length
    + (r.homepage ? 1 : 0) + Math.log10(1 + r.size) - (r.fork ? 3 : 0) - (r.archived ? 1 : 0);
}

function countBy(xs) {
  const m = new Map();
  for (const x of xs) if (x) m.set(x, (m.get(x) || 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1]);
}

function derive(data) {
  const { repos, contributions } = data;
  const byYear = new Map();
  for (const r of repos) {
    const y = yearOf(r.created);
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y).push(r);
  }

  /* sem token: atividade = repos criados + último push, por mês */
  const activity = {};
  if (!contributions) {
    const bump = iso => {
      const d = new Date(iso), y = d.getUTCFullYear();
      (activity[y] ||= Array(12).fill(0))[d.getUTCMonth()]++;
    };
    for (const r of repos) {
      bump(r.created);
      if (r.pushed && r.pushed.slice(0, 7) !== r.created.slice(0, 7)) bump(r.pushed);
    }
  }

  const years = new Set(byYear.keys());
  for (const [y, row] of Object.entries(contributions || activity)) if (row.some(Boolean)) years.add(Number(y));
  const sorted = [...years].sort((a, b) => a - b);

  const months = contributions || activity;

  /* topics que só repetem a linguagem (html, python…) não contam como novidade */
  const norm = x => x.toLowerCase().replace(/[^a-z0-9+#]/g, '');
  const seen = new Set();
  const topStar = Math.max(0, ...repos.filter(r => !r.fork).map(r => r.stars));

  const eras = sorted.map(y => {
    const list = byYear.get(y) || [];
    const own = list.filter(r => !r.fork);
    const langs = countBy(own.map(r => r.language));
    const topics = countBy(own.flatMap(r => r.topics));

    const newLangs = langs.filter(([l]) => !seen.has(norm(l)));
    langs.forEach(([l]) => seen.add(norm(l)));
    const newTopics = topics.filter(([t]) => !seen.has(norm(t)));
    topics.forEach(([t]) => seen.add(norm(t)));

    /* título: o que aparece pela primeira vez no ano, pesado por frequência */
    const fresh = [...newLangs.map(([n, c]) => [n, c + 0.5]), ...newTopics].sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]);
    let title;
    if (!list.length) title = 'Sem repositórios novos';
    else if (fresh.length) title = (sorted[0] === y ? 'Começo com ' : 'Entram ') + joinPt(fresh);
    else if (langs.length) title = `Consolidação em ${langs[0][0]}`;
    else title = `${plural(list.length, 'repositório', 'repositórios')} sem linguagem detectada`;

    const lead = [];
    if (list.length) {
      const forks = list.length - own.length;
      lead.push(`${plural(list.length, 'repositório criado', 'repositórios criados')}${forks ? ` (${plural(forks, 'fork', 'forks')})` : ''}.`);
      if (langs.length) lead.push(`Linguagem predominante: <b>${esc(langs[0][0])}</b> (${langs[0][1]} de ${own.length}).`);
      if (topics.length) lead.push(`Topics mais usados: ${topics.slice(0, 4).map(([t]) => esc(t)).join(', ')}.`);
      const best = own.slice().sort((a, b) => b.stars - a.stars)[0];
      if (best && best.stars > 0) lead.push(`Mais estrelado: <b>${esc(best.name)}</b> (★ ${nf.format(best.stars)}).`);
    }
    if (contributions?.[y]) {
      const tot = contributions[y].reduce((a, b) => a + b, 0);
      lead.push(`${plural(tot, 'contribuição', 'contribuições')} no ano.`);
    }

    const ranked = list.slice().sort((a, b) => score(b) - score(a));
    return {
      year: y, title, lead: lead.join(' '),
      skills: { langs: newLangs.map(x => x[0]), topics: newTopics.slice(0, 12).map(x => x[0]) },
      repos: ranked, bigName: ranked[0] && !ranked[0].fork && ranked[0].stars === topStar && topStar >= 10 ? ranked[0].name : null
    };
  });

  const own = repos.filter(r => !r.fork);
  const langTotals = countBy(own.map(r => r.language));
  const withLang = langTotals.reduce((a, [, c]) => a + c, 0);

  return {
    eras, months, real: !!contributions,
    stats: {
      repos: repos.length, own: own.length, forks: repos.length - own.length,
      stars: own.reduce((a, r) => a + r.stars, 0),
      span: sorted.length ? [sorted[0], sorted[sorted.length - 1]] : null
    },
    langs: { totals: langTotals, n: withLang }
  };
}

/* ---------- render ---------- */

function renderLanding() {
  document.title = 'GitHub Timeline';
  app.innerHTML = `
    <section class="landing">
      <h1>A trajetória de um perfil do GitHub, ano a ano</h1>
      <p>Digite um usuário. A página lê os repositórios públicos pela API do GitHub e monta a linha do tempo a partir dos metadados: datas, linguagens, topics, descrições e stars.</p>
      <form class="search" id="landsearch" role="search">
        <input name="u" placeholder="ex.: torvalds" aria-label="Usuário do GitHub" autocomplete="off" spellcheck="false" autofocus>
        <button class="btn primary" type="submit">Ver timeline</button>
      </form>
      <p class="hint">Atalho: <code>${esc(location.origin + BASE)}&lt;usuário&gt;</code></p>
    </section>`;
  bindSearch(document.getElementById('landsearch'));
}

function renderLoading(user) {
  document.title = `${user} · GitHub Timeline`;
  app.innerHTML = `
    <section class="hero" aria-busy="true">
      <div class="who"><div class="avatar skel"></div><div style="flex:1">
        <div class="skel" style="height:30px;width:40%;margin-bottom:10px"></div>
        <div class="skel" style="height:16px;width:70%"></div></div></div>
      <div class="stats">${'<div class="stat skel" style="height:66px"></div>'.repeat(4)}</div>
      <p class="mono" style="color:var(--fg-muted);font-size:12px;margin:16px 0 0">Lendo repositórios de @${esc(user)}…</p>
    </section>`;
}

function renderError(title, msg, extra = '') {
  document.title = 'GitHub Timeline';
  app.innerHTML = `<section class="state error"><h2>${title}</h2><p>${msg}</p>${extra}
    <form class="search" id="errsearch" role="search">
      <input name="u" placeholder="outro usuário" aria-label="Usuário do GitHub" autocomplete="off" spellcheck="false">
      <button class="btn" type="submit">Buscar</button>
    </form></section>`;
  bindSearch(document.getElementById('errsearch'));
}

function level(n, max, real) {
  if (!n) return 0;
  if (!real) return n >= 5 ? 4 : n >= 3 ? 3 : n >= 2 ? 2 : 1;
  return Math.min(4, Math.max(1, Math.ceil((n / max) * 4)));
}

function monthsColumn(year, row, max, real) {
  const unit = real ? ['contribuição', 'contribuições'] : ['evento', 'eventos'];
  const total = row.reduce((a, b) => a + b, 0);
  const cells = row.map((n, i) => {
    const label = plural(n, ...unit);
    return `<span class="mo l${level(n, max, real)}" tabindex="0" aria-label="${MESES[i]} de ${year}: ${label}"><span class="tip">${label} <b>${MESES[i]}/${String(year).slice(2)}</b></span></span>`;
  }).join('');
  return `<div class="era-months" role="img" aria-label="${plural(total, ...unit)} em ${year}, por mês de janeiro a dezembro">${cells}</div>`;
}

function repoCard(r, big) {
  const meta = [];
  if (r.language) meta.push(`<span class="lang"><i class="ld" style="background:${langColor(r.language)}"></i>${esc(r.language)}</span>`);
  if (r.stars) meta.push(`<span class="st">${STAR} ${nf.format(r.stars)}</span>`);
  if (r.forks) meta.push(`<span class="st">${FORK12} ${nf.format(r.forks)}</span>`);
  if (r.homepage && /^https?:\/\//i.test(r.homepage)) meta.push(`<a class="st" href="${esc(r.homepage)}" rel="noopener nofollow">${LINK} site</a>`);
  meta.push(`<span>Criado em ${fmtMonth(r.created)}</span>`);
  if (r.pushed && r.pushed.slice(0, 7) !== r.created.slice(0, 7)) meta.push(`<span>push ${fmtMonth(r.pushed)}</span>`);
  return `<div class="repo${big ? ' big' : ''}">
    <div class="rhead">
      <span class="name">${OCTO}<a href="${esc(r.url)}" rel="noopener">${esc(r.name)}</a></span>
      ${r.fork ? `<span class="badge fork">${FORK}fork</span>` : ''}
      ${r.archived ? `<span class="badge arch">arquivado</span>` : ''}
    </div>
    <div class="desc${r.description ? '' : ' empty'}">${r.description ? esc(r.description) : 'Sem descrição.'}</div>
    ${r.topics.length ? `<div class="topics">${r.topics.map(t => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
    <div class="meta">${meta.join('')}</div>
  </div>`;
}

function eraBlock(e, months, max, real) {
  const row = months[e.year] || Array(12).fill(0);
  const shown = e.repos.slice(0, PER_YEAR), rest = e.repos.slice(PER_YEAR);
  const skills = [
    ...e.skills.langs.map(l => `<span class="skill lang"><i style="background:${langColor(l)}"></i>${esc(l)}</span>`),
    ...e.skills.topics.map(t => `<span class="skill">${esc(t)}</span>`)
  ];
  return `
  <div class="era">
    <div class="era-rail"><div class="era-marker"><span class="node"></span><div class="yr">${e.year}</div></div></div>
    ${monthsColumn(e.year, row, max, real)}
    <div class="era-body">
      <h3>${esc(e.title)}</h3>
      ${e.lead ? `<p class="lead">${e.lead}</p>` : ''}
      ${skills.length ? `<div class="skills" aria-label="Linguagens e topics que aparecem pela primeira vez em ${e.year}">${skills.join('')}</div>` : ''}
      ${shown.length ? `<div class="repos">${shown.map(r => repoCard(r, r.name === e.bigName)).join('')}</div>` : ''}
      ${rest.length ? `<div class="repos more" hidden>${rest.map(r => repoCard(r, false)).join('')}</div>
        <button class="btn more" type="button" data-more aria-expanded="false">Mostrar todos (${e.repos.length})</button>` : ''}
    </div>
  </div>`;
}

function langSection(langs) {
  if (!langs.n) return '';
  const top = langs.totals.slice(0, 6);
  const other = langs.n - top.reduce((a, [, c]) => a + c, 0);
  const items = top.map(([l, c]) => [l, c, langColor(l)]);
  if (other > 0) items.push(['Outras', other, '#8b949e']);
  const pct = c => Math.round((c / langs.n) * 1000) / 10;
  const aria = items.map(([l, c]) => `${l} ${pct(c)}%`).join(', ');
  return `
  <section class="langsec">
    <h2>Linguagem primária de ${plural(langs.n, 'repositório próprio', 'repositórios próprios')}</h2>
    <div class="langbar" role="img" aria-label="${esc(aria)}">
      ${items.map(([, c, col]) => `<span style="width:${pct(c)}%;background:${col}"></span>`).join('')}
    </div>
    <div class="langlegend">
      ${items.map(([l, c, col]) => `<span><i class="dot" style="background:${col}"></i><b>${esc(l)}</b> <span class="pct">${pct(c)}%</span></span>`).join('')}
    </div>
  </section>`;
}

function legend(d, data) {
  const total = Object.values(d.months).flat().reduce((a, b) => a + b, 0);
  const scale = `<span style="display:inline-flex;align-items:center;gap:4px;margin-left:4px">menos
      <i style="background:var(--lv0)"></i><i style="background:var(--lv1)"></i><i style="background:var(--lv2)"></i><i style="background:var(--lv3)"></i><i style="background:var(--lv4)"></i>
    mais</span>`;
  const tokenUi = getToken()
    ? `<button class="linkish" type="button" id="tok-clear">remover token</button>`
    : `<button class="linkish" type="button" id="tok-open">adicionar token</button> para ver contribuições reais.`;
  const note = d.real
    ? `<span class="note"><em>Contribuições</em> = calendário de contribuições do GitHub (commits, PRs, issues, reviews), lido com seu token. ${tokenUi}</span>`
    : `<span class="note"><em>Eventos</em> = repositórios criados + último push de cada repositório no mês. A API pública não expõe contribuições sem autenticação — ${tokenUi}${data.contribError ? ` <span style="color:var(--danger-fg)">(${esc(data.contribError)})</span>` : ''}</span>`;
  return `
  <div class="commit-legend">
    <span class="total">${plural(total, d.real ? 'contribuição' : 'evento', d.real ? 'contribuições' : 'eventos')}</span>
    ${d.stats.span ? `ao longo de ${d.stats.span[0]}&ndash;${d.stats.span[1]}` : ''} &mdash; um quadrado por mês ao lado de cada ano.
    ${scale}
    ${note}
    <form class="token-form" id="tok-form" hidden>
      <input type="password" name="t" placeholder="ghp_… ou github_pat_…" aria-label="Token pessoal do GitHub" autocomplete="off">
      <button class="btn primary" type="submit">Salvar</button>
      <small>Token sem escopos basta (classic) ou fine-grained só leitura pública. Fica salvo apenas no <code>localStorage</code> deste navegador e só é enviado para <code>api.github.com</code>.</small>
    </form>
  </div>`;
}

function renderProfile(data) {
  const { profile: p } = data;
  const d = derive(data);
  document.title = `${p.name || p.login} · GitHub Timeline`;
  document.getElementById('slug-user').textContent = p.login;

  const max = Math.max(1, ...Object.values(d.months).flat());
  const span = d.stats.span ? (d.stats.span[0] === d.stats.span[1] ? `${d.stats.span[0]}` : `${d.stats.span[0]}&ndash;${d.stats.span[1]}`) : '&mdash;';

  app.innerHTML = `
    <section class="hero">
      <div class="who">
        <img class="avatar" src="${esc(p.avatar)}&s=176" alt="" width="88" height="88">
        <div>
          <h1>${esc(p.name || p.login)}</h1>
          <p class="login mono"><a href="${esc(p.url)}" rel="noopener">@${esc(p.login)}</a> &middot; no GitHub desde ${fmtMonth(p.created)}</p>
          ${p.bio ? `<p class="bio">${esc(p.bio)}</p>` : ''}
        </div>
      </div>
      <div class="stats">
        <div class="stat"><div class="n">${nf.format(d.stats.repos)}</div><div class="l">repositórios públicos</div></div>
        <div class="stat"><div class="n">${nf.format(d.stats.own)} · ${nf.format(d.stats.forks)}</div><div class="l">próprios · forks</div></div>
        <div class="stat"><div class="n">${span}</div><div class="l">anos de atividade</div></div>
        <div class="stat"><div class="n">${nf.format(d.stats.stars)}</div><div class="l">stars nos próprios</div></div>
      </div>
      ${data.truncated ? `<p style="color:var(--fg-muted);font-size:12px;margin:12px 0 0">Mostrando os primeiros ${MAX_PAGES * 100} repositórios.</p>` : ''}
    </section>
    ${langSection(d.langs)}
    <h2 class="eyebrow" id="linha-do-tempo" style="padding-top:24px">Linha do tempo</h2>
    ${d.eras.length ? legend(d, data) : ''}
    <div class="timeline">
      ${d.eras.length ? d.eras.map(e => eraBlock(e, d.months, max, d.real)).join('')
        : `<p style="color:var(--fg-muted)">@${esc(p.login)} ainda não tem repositórios públicos.</p>`}
    </div>`;
  bindProfile();
}

/* ---------- eventos ---------- */

function bindSearch(form) {
  form.addEventListener('submit', ev => {
    ev.preventDefault();
    const input = form.elements.u;
    go(input.value);
    input.value = '';
    input.blur();
  });
}

function bindProfile() {
  app.querySelectorAll('[data-more]').forEach(btn => {
    const label = btn.textContent;
    btn.addEventListener('click', () => {
      const more = btn.previousElementSibling;
      more.hidden = !more.hidden;
      btn.setAttribute('aria-expanded', String(!more.hidden));
      btn.textContent = more.hidden ? label : 'Mostrar menos';
    });
  });

  const form = document.getElementById('tok-form');
  document.getElementById('tok-open')?.addEventListener('click', () => { form.hidden = false; form.elements.t.focus(); });
  document.getElementById('tok-clear')?.addEventListener('click', () => { store.del('localStorage', 'ght-token'); route(); });
  form?.addEventListener('submit', ev => {
    ev.preventDefault();
    const t = form.elements.t.value.trim();
    if (!t) return;
    store.set('localStorage', 'ght-token', t);
    route();
  });
}

let seq = 0;
async function load(user) {
  const mine = ++seq;
  renderLoading(user);
  try {
    const data = await fetchAll(user);
    if (mine !== seq) return;
    renderProfile(data);
  } catch (e) {
    if (mine !== seq) return;
    if (e.kind === 'notfound') return renderError('Usuário não encontrado', `Não existe perfil público <b>@${esc(user)}</b> no GitHub.`);
    if (e.kind === 'ratelimit') {
      const when = e.reset ? new Date(e.reset).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'em até uma hora';
      return renderError('Limite da API atingido',
        `Sem autenticação, a API do GitHub aceita 60 requisições por hora por IP. O limite volta às <b>${when}</b>. Com um token pessoal o limite sobe para 5.000/h.`,
        tokenBox());
    }
    if (e.kind === 'auth') {
      store.del('localStorage', 'ght-token');
      return renderError('Token recusado', 'O token salvo foi rejeitado pelo GitHub e foi removido. Recarregue para continuar sem token.');
    }
    renderError('Algo deu errado', esc(e.message || String(e)));
  }
}

function tokenBox() {
  queueMicrotask(() => {
    const form = document.getElementById('tok-form');
    form?.addEventListener('submit', ev => {
      ev.preventDefault();
      const t = form.elements.t.value.trim();
      if (t) { store.set('localStorage', 'ght-token', t); route(); }
    });
  });
  return `<form class="token-form" id="tok-form" style="margin-bottom:16px">
      <input type="password" name="t" placeholder="ghp_… ou github_pat_…" aria-label="Token pessoal do GitHub" autocomplete="off">
      <button class="btn primary" type="submit">Usar token</button>
      <small style="color:var(--fg-muted)">Fica salvo apenas no <code>localStorage</code> deste navegador.</small>
    </form>`;
}

document.getElementById('tt').addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : cur === 'light' ? 'dark'
    : (matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark');
  document.documentElement.setAttribute('data-theme', next);
  store.set('localStorage', 'ght-theme', next);
});

document.getElementById('slug').href = BASE;
document.getElementById('slug').addEventListener('click', ev => {
  ev.preventDefault();
  history.pushState(null, '', BASE);
  route();
});
bindSearch(document.getElementById('topsearch'));
window.addEventListener('popstate', route);

/* ?u= vira path limpo (servidor local não tem fallback 404) */
const initial = new URLSearchParams(location.search).get('u');
if (initial && BASE !== '/') history.replaceState(null, '', BASE + encodeURIComponent(initial.trim()));
route();
