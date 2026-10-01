# GitHub Timeline v2 — especificação

A v1 é uma página estática no GitHub Pages: o navegador do visitante consulta a API pública do GitHub e monta a timeline. A v2 passa a ter um servidor próprio. Com ele, o projeto ganha:

- contribuições reais para qualquer perfil;
- imagem de compartilhamento (Open Graph) e badge para README;
- galeria de perfis e comparação entre dois perfis;
- páginas que já chegam renderizadas, com meta tags indexáveis.

Este documento descreve o comportamento esperado, as regras de derivação e a arquitetura.

O endereço canônico da v2 é `https://github-timeline.frangolab.com`.

## Sumário

1. [Rotas](#1-rotas)
2. [Telas](#2-telas)
3. [Coleta de dados](#3-coleta-de-dados)
4. [Regras de derivação](#4-regras-de-derivação)
5. [Imagem de compartilhamento e badge](#5-imagem-de-compartilhamento-e-badge)
6. [Estados](#6-estados)
7. [Arquitetura](#7-arquitetura)
8. [Requisitos não funcionais](#8-requisitos-não-funcionais)
9. [Migração da v1](#9-migração-da-v1)
10. [Entregas](#10-entregas)

---

## 1. Rotas

| Rota | Conteúdo |
|---|---|
| `/` | landing |
| `/u/<login>` | timeline do perfil. Aceita `?tema=escuro\|claro` |
| `/u/<a>...<b>` | comparação entre dois perfis |
| `/u/<login>/card.png` | imagem 1200×630. Aceita `?tema=` e `?variante=headline\|numero` |
| `/badge/<login>.svg` | badge para README |
| `/api/profile/<login>` | snapshot derivado, em JSON |
| `/api/status/<login>` | progresso de coleta (Server-Sent Events) |
| `/healthz` | verificação de saúde |

O prefixo `/u/` separa os logins das rotas do sistema: existem contas no GitHub chamadas `api`, `badge` etc.

O campo de busca aceita `login`, `@login` e `https://github.com/login`.

---

## 2. Telas

Todas as telas têm tema claro e escuro, e funcionam de 390px a 1280px ou mais.

### 2.1 Landing

- Topbar: marca, navegação (Explorar · Comparar · Badge), contagem de stars do repositório do projeto, alternância de tema.
- Hero: título, campo `github.com/<login>` com ação "Gerar timeline", atalho para comparar dois perfis. Ao fundo, uma grade de contribuições decorativa.
- Contador "N timelines geradas esta semana" (janela móvel de 7 dias).
- Galeria "Perfis para explorar", com abas:
  - **Em alta**: perfis mais visitados em 7 dias;
  - **Lendas**, **Brasil**, **Criadores de linguagem**: listas curadas em `data/curated.json` (§2.3).

  Cada card mostra avatar, nome, `@login · desde AAAA`, uma minigrade de atividade, a linguagem principal, o nº de repositórios e as stars. Os cards são servidos de snapshots, sem consultar o GitHub a cada visita.
- Seção do badge: prévia e snippet Markdown copiável.
- Rodapé: "Dados da API pública do GitHub.", crédito e link do código.

### 2.2 Perfil

- Topbar com busca, tema e "Copiar link".
- Cabeçalho: avatar, nome, `@login · no GitHub desde mmm AAAA`, ações "Compartilhar no X", "LinkedIn", "Baixar card".
- **Resumo**: manchete (§4.1); quatro indicadores (anos de atividade, repositórios públicos com próprios · forks, stars nos próprios com o repo de destaque, ano recorde); barra de linguagens com percentuais.
- **Conquistas** (§4.2).
- **Linha do tempo** (§4.3).
- Chamada para compartilhar: URL canônica, botão de copiar e badge.

No mobile, os indicadores ficam em grade 2×2, as conquistas viram um carrossel horizontal e os 12 meses de cada ano formam uma faixa horizontal.

### 2.3 Listas curadas iniciais

As listas são editoriais, com ordem fixa; não representam um ranking nem endosso das pessoas. `data/curated.json` guarda apenas logins e ordem por categoria. Nome, avatar e métricas vêm do snapshot. Na atualização dos snapshots, validar que o login ainda existe, é do tipo `User` e tem repositórios públicos; se falhar, omitir o card e registrar o motivo. A lista pode ser revista sem alterar a lógica da aplicação.

| Aba | Logins iniciais (na ordem) | Critério |
|---|---|---|
| Lendas | [`torvalds`](https://github.com/torvalds), [`sindresorhus`](https://github.com/sindresorhus), [`tj`](https://github.com/tj), [`dhh`](https://github.com/dhh), [`antirez`](https://github.com/antirez), [`yyx990803`](https://github.com/yyx990803) | autores de projetos de código aberto amplamente conhecidos, com trajetórias diferentes |
| Brasil | [`filipedeschamps`](https://github.com/filipedeschamps), [`diego3g`](https://github.com/diego3g), [`loiane`](https://github.com/loiane), [`maykbrito`](https://github.com/maykbrito), [`omariosouto`](https://github.com/omariosouto), [`beatrizmilz`](https://github.com/beatrizmilz), [`TeoCalvo`](https://github.com/TeoCalvo) | pessoas brasileiras conhecidas pela comunidade, educação ou código aberto; mistura web, Java e dados |
| Criadores de linguagem | [`gvanrossum`](https://github.com/gvanrossum) (Python), [`matz`](https://github.com/matz) (Ruby), [`graydon`](https://github.com/graydon) (Rust), [`andrewrk`](https://github.com/andrewrk) (Zig), [`JeffBezanson`](https://github.com/JeffBezanson) (Julia) | criadores ou cocriadores de linguagens com perfil público |

Um perfil pode constar em mais de uma categoria. A posição na lista não muda com stars ou visitas. Revisar a curadoria periodicamente e respeitar a opção de não aparecer na galeria (§8); essa opção também retira o perfil das listas curadas.

As atribuições da última aba podem ser conferidas nas fontes dos projetos: [Python](https://www.python.org/doc/essays/foreword/), [Ruby](https://www.ruby-lang.org/en/), [Rust](https://rust-lang.org/governance/people/graydon/), [Zig](https://ziglang.org/) e [Julia](https://julialang.org/blog/2012/02/why-we-created-julia/). Os links dos logins acima apontam aos perfis consultados para a curadoria.

### 2.4 Comparação

Dois cabeçalhos lado a lado e barras proporcionais ao maior valor para repositórios, stars, anos de atividade e nº de linguagens. No desktop as barras são espelhadas; no mobile ficam empilhadas por métrica.

---

## 3. Coleta de dados

Todas as consultas usam o token do servidor. Para um perfil novo:

1. `GET /users/{login}`: perfil e tipo (`User` ou `Organization`).
2. GraphQL `user.repositories(privacy: PUBLIC, ownerAffiliations: OWNER, first: 100)`, paginado. Por repositório: linguagem primária, topics, stars, forks, descrição, homepage, datas e `forks(first: 1, orderBy: CREATED_AT)`.
3. GraphQL `contributionsCollection`, um alias por ano de atividade: `contributionCalendar` (agregado por mês) e `commitContributionsByRepository` (contribuições em repositórios de organizações).

O filtro `privacy: PUBLIC` é obrigatório. Sem ele, os repositórios privados da conta dona do token aparecem na página dessa conta.

**Limitação da API.** A lista de stargazers de um repositório só é visível para o dono. Para terceiros, o GraphQL devolve `totalCount: 0` e o REST responde 404. Por isso, nenhuma regra depende da data de uma estrela.

**Custo medido** (setembro de 2026, 16 perfis públicos): perfis com até ~300 repositórios custam de 3 a 6 pontos GraphQL. O maior caso medido, com ~1.100 repositórios, custa cerca de 36. A cota do token é de 5.000 pontos por hora.

**Snapshot.** O resultado derivado é salvo com TTL de 12 h. Se a visita encontra um snapshot vencido, recebe o antigo e uma atualização é disparada em segundo plano.

---

## 4. Regras de derivação

### 4.1 Manchete

Formato: **"N anos. M repositórios."** seguido de um fecho. Vale a primeira condição verdadeira:

| Forma | Condição | Fecho |
|---|---|---|
| Estrela | um repositório próprio tem ≥ 1.000★ e ≥ 40% das stars do perfil | "X ★ em `repo`." |
| Transição | a tecnologia dos 2 primeiros anos difere da dos 2 últimos | "De A a B." |
| Poliglota | ≥ 6 linguagens primárias distintas em repositórios próprios | "N linguagens, A primeiro." |
| Fiel | nenhuma das anteriores | "Fiel ao A desde AAAA." |

Na transição, **A** é a linguagem predominante dos 2 primeiros anos com repositórios próprios. **B** é o primeiro que existir, nesta ordem:

1. framework que aparece pela primeira vez nos topics dos 2 últimos anos, em ≥ 2 repositórios, a partir do catálogo abaixo;
2. a linguagem predominante dos 2 últimos anos;
3. a linguagem predominante das contribuições em repositórios de organizações.

O terceiro critério cobre quem publica o trabalho principal em organizações. Sem ele, um perfil como o de Evan You (Vue em `vuejs`) recebe "Fiel ao JavaScript".

**Catálogo inicial de frameworks.** A correspondência é exata com o topic do GitHub, após converter para minúsculas. Os aliases da mesma linha contam como um único framework; não inferir tecnologia por nome de repositório, descrição, linguagem ou dependência. Este catálogo inclui bibliotecas de interface conhecidas como React e Vue porque são usadas como marcos de trajetória, mesmo quando não são formalmente frameworks.

| Exibição | Topics aceitos |
|---|---|
| React | `react`, `reactjs` |
| Next.js | `nextjs`, `next-js` |
| Angular | `angular`, `angularjs` |
| Vue | `vue`, `vuejs` |
| Nuxt | `nuxt`, `nuxtjs` |
| Svelte | `svelte`, `sveltejs` |
| SvelteKit | `sveltekit`, `svelte-kit` |
| Astro | `astro`, `astrojs` |
| Django | `django` |
| Flask | `flask` |
| FastAPI | `fastapi` |
| Rails | `rails`, `ruby-on-rails` |
| Laravel | `laravel` |
| Spring Boot | `spring-boot`, `springboot` |
| NestJS | `nestjs`, `nest-js` |
| Express | `express`, `expressjs` |
| Flutter | `flutter` |
| React Native | `react-native`, `reactnative` |

Se dois frameworks se qualificarem, escolher o de mais repositórios no período recente; em empate, o primeiro ano de aparição e depois o nome de exibição em ordem alfabética. Topics genéricos ou ambíguos, como `next`, `spring`, `nodejs` e `web`, não são aliases. O catálogo é versionado e uma mudança nele exige recalcular snapshots afetados.

Os aliases iniciais foram selecionados a partir dos [topics públicos do GitHub](https://github.com/topics) e dos repositórios oficiais, como [Next.js](https://github.com/vercel/next.js), [Django](https://github.com/django/django) e [FastAPI](https://github.com/fastapi/fastapi). Eles são uma regra editorial da v2, não uma taxonomia oficial do GitHub.

Exemplos com dados de setembro de 2026:

| Perfil | Forma | Manchete |
|---|---|---|
| torvalds | estrela | 16 anos. 12 repositórios. 250,7k ★ em linux. |
| sindresorhus | estrela | 16 anos. 1.141 repositórios. 512,9k ★ em awesome. |
| tj | transição | 13 anos. 296 repositórios. De Ruby a Go. |
| ThePrimeagen | transição | 14 anos. 239 repositórios. De JavaScript a Lua. |
| Moscarde | transição (topic) | 6 anos. 97 repositórios. De HTML a Django. |
| yyx990803 | transição (organizações) | 17 anos. 198 repositórios. De JavaScript a Vue. |
| karpathy | poliglota | 16 anos. 63 repositórios. 11 linguagens, Python primeiro. |

A imagem de compartilhamento usa a forma curta: "N anos de código." + fecho.

### 4.2 Conquistas

Todas são calculadas a partir das consultas da §3, sem chamadas extras.

| Conquista | Desbloqueio | Texto exibido |
|---|---|---|
| Primeiro repo | sempre | data do repositório público mais antigo |
| Estrelado | algum repositório próprio com ≥ 1★ | o mais antigo deles |
| 100 stars | algum repositório próprio com ≥ 100★ | o repositório |
| 1.000 stars | algum repositório próprio com ≥ 1.000★ | o repositório |
| Primeiro fork | algum repositório próprio já foi forkado | data do fork mais antigo |
| Poliglota | ≥ 5 linguagens primárias distintas | nº de linguagens |
| Ano recorde | sempre | ano com mais repositórios criados |
| Uma década | 10 anos desde o primeiro repositório | progresso: anos restantes |
| 50 topics | ≥ 50 topics distintos | progresso: "34 de 50" |

O catálogo fica em código (regra, ícone, cor e texto de progresso). As bloqueadas aparecem com opacidade reduzida e em cinza.

### 4.3 Linha do tempo

Mantém as regras da v1, com estas mudanças:

- **Capítulo** = ano de criação dos repositórios.
- **Título** = linguagens e topics que aparecem pela primeira vez no ano, pesados por frequência. Topics iguais a uma linguagem (`python`, `html`) não contam.
- **Parágrafo** = contagens do ano: repositórios, forks, linguagem predominante, topics mais usados, mais estrelado.
- **Destaques** = os 6 maiores por score (stars, forks, descrição, topics, homepage, tamanho; forks e arquivados perdem pontos), com "mostrar todos". O mais estrelado do ano ocupa a largura toda e ganha o selo "mais estrelado".
- **Grade mensal** = contribuições públicas reais, incluindo organizações. Acabam o modo "eventos de repositório" e o token do visitante.
- O ano recorde aparece destacado em verde.
- Tooltip próprio e focável em cada mês, sem o atributo `title`.
- Paginação: os 4 primeiros anos, depois "Ver AAAA – AAAA".

---

## 5. Imagem de compartilhamento e badge

### 5.1 Card (Open Graph)

- 1200×630 PNG. Conteúdo: avatar, nome, manchete curta (variante `headline`) ou nº de repositórios (variante `numero`), grade ano × mês dos últimos 8 anos, top 3 linguagens, três indicadores e `github-timeline.frangolab.com`.
- **Segue o tema**: "Baixar card" e "Compartilhar" usam o tema ativo na página. O link compartilhado inclui `?tema=`, e o `og:image` dessa URL usa o mesmo tema. O padrão é escuro.
- `/u/<login>` é renderizada no servidor com `og:title`, `og:description`, `og:image` e `twitter:card=summary_large_image`.
- O PNG é cacheado por login, tema, variante e versão do snapshot.

### 5.2 Badge

- `GET /badge/<login>.svg` → "Timeline · AAAA–AAAA · N repos", com o símbolo próprio (§5.3).
- `Content-Type: image/svg+xml`, `Cache-Control: max-age=3600`, servido do snapshot.
- Login inexistente gera um badge cinza "não encontrado" com status 200, porque o proxy de imagens do GitHub não exibe respostas de erro.

### 5.3 Marca própria

Usar a direção **1 — Path of activity** como identidade **Timeline** da v2. Os arquivos oficiais estão em [`reference/Timeline_Design_Kit/timeline_design_kit/direction-1-path-of-activity/`](../reference/Timeline_Design_Kit/timeline_design_kit/direction-1-path-of-activity/); o [README do kit](../reference/Timeline_Design_Kit/timeline_design_kit/README.md) descreve as regras gerais de uso. O símbolo combina linha temporal horizontal, marcos de atividade e descoberta.

Aplicar os arquivos dessa direção na topbar, favicon, card e badge: `svg/logo-light.svg` em fundo claro, `svg/logo-dark.svg` em fundo escuro, `svg/symbol.svg` ou `svg/symbol-dark.svg` quando houver espaço apenas para o símbolo, e `favicon.ico` ou PNG de 16/32 px para favicon. Preferir SVG na interface e na documentação; usar os arquivos `*-dark` em fundos escuros. Para o badge dinâmico do §5.2, usar `svg/badge.svg` ou `svg/badge-dark.svg` como referência visual e incluir o símbolo da direção 1, preservando anos e contagens do perfil. Não alterar as proporções do símbolo ou lockup e manter uma área de respiro de pelo menos metade da altura do símbolo.

Os [tokens do kit](../reference/Timeline_Design_Kit/timeline_design_kit/brand-tokens.json) definem verde principal `#22C55E`, verde suave `#DCFCE7`, carvão `#0F172A`, ardósia `#475569`, cinza de apoio `#64748B`, fundo claro `#F8FAFC`, linha `#E2E8F0`, branco `#FFFFFF` e preto `#000000`. Aplicar os tokens por variáveis CSS nos dois temas e manter o contraste AA exigido no §8; o verde claro da marca não substitui automaticamente o verde de texto `#1a7f37` sobre fundo claro. O wordmark dos SVGs já usa contornos vetoriais e não depende de fonte para ser exibido.

“Perfis públicos do GitHub” aparece somente como descrição fora do logo. A identidade Timeline é independente; não usar o logotipo do GitHub como marca do produto, conforme a [política oficial](https://brand.github.com/foundations/logo).

---

## 6. Estados

| Estado | Comportamento |
|---|---|
| Perfil novo, coletando | Cabeçalho real assim que `/users` responde. O restante aparece como skeleton, ao lado de um painel de etapas (perfil → repositórios → contribuições → conquistas e card), atualizado por SSE |
| Login inexistente | HTTP 404. Sugestão "Você quis dizer" via `GET /search/users` (cacheada) |
| Cota esgotada ou GitHub instável, com snapshot | Mostra o snapshot com uma faixa "dados de há X; atualização às HH:MM" |
| Cota esgotada ou GitHub instável, sem snapshot | Entra na fila, mostra a posição estimada e atualiza a página quando terminar |
| Sem repositórios públicos | Mensagem "A história ainda não começou", sem timeline |
| Organização | Não monta timeline. Lista os maiores contribuidores dos repositórios públicos, com link para a página de cada um |

---

## 7. Arquitetura

| Componente | Escolha | Motivo |
|---|---|---|
| Runtime | Node 22 + TypeScript | uma linguagem para servidor, renderização e geração de imagem |
| HTTP e SSR | Hono (`hono/jsx`) | leve; JSX no servidor sem framework de front-end |
| Imagem OG | Satori + resvg-js | PNG gerado de JSX/flexbox em ~50–100 ms, sem navegador headless |
| Persistência | SQLite (`better-sqlite3`, WAL) | snapshots, eventos de visita, fila e cache em um arquivo |
| Fila | tabela SQLite + worker no mesmo processo | deduplicação por login, sem serviço externo |
| Cliente | JS mínimo | tema, copiar, tooltips, abas, paginação |
| Deploy | um container atrás de proxy/CDN | |

Fontes da interface (Mona Sans e JetBrains Mono) auto-hospedadas: o Satori precisa dos arquivos para textos dinâmicos, e a página deixa de depender de CDN de fontes. O wordmark vetorial do design kit não precisa dessas fontes.

---

## 8. Requisitos não funcionais

| Tema | Requisito |
|---|---|
| Desempenho | Snapshot em cache: TTFB < 300 ms. Perfil novo: cabeçalho em < 1 s e página completa em < 5 s para 95% dos perfis |
| Cota | Monitorar os pontos GraphQL restantes. Abaixo de 10%, servir só snapshots e enfileirar o resto |
| Abuso | Rate limit por IP nas rotas que disparam coleta. Uma coleta por login por vez |
| Segurança | Token só em variável de ambiente. Escapar todo conteúdo vindo do GitHub no HTML, no SVG e no JSX do card. CSP restritiva |
| Acessibilidade | Elementos interativos focáveis, foco visível, `prefers-reduced-motion`, alvos ≥ 44px no mobile, contraste AA nos dois temas. No tema claro, o verde de texto é `#1a7f37` |
| Tema | Tokens em CSS custom properties. Preferência em cookie, para a renderização no servidor já sair no tema certo |
| Privacidade | Eventos de visita guardam login e hash diário do IP, nunca o IP bruto, por 30 dias. Opção de não aparecer em qualquer galeria, inclusive listas curadas |
| Observabilidade | Logs estruturados. Métricas de cota restante, acerto de cache e duração de coleta |
| Idioma | pt-BR (`1,4k`, `41,7%`, meses abreviados) |

---

## 9. Migração da v1

- O repositório do GitHub Pages vira um redirecionador: `index.html` e `404.html` levam `/github-timeline/<login>` para `https://github-timeline.frangolab.com/u/<login>` (`location.replace` + `<link rel="canonical">`). A landing redireciona para `https://github-timeline.frangolab.com/`.
- Badge e snippets usam o domínio novo desde o lançamento.
- O host canônico é `github-timeline.frangolab.com`, sempre em HTTPS. URLs absolutas de `canonical`, `og:image`, card, badge e compartilhamento usam esse host; a aplicação não deriva o host de cabeçalhos da requisição.

---

## 10. Entregas

1. **Base**:
   - servidor, coleta e snapshot;
   - páginas `/` e `/u/<login>`, nos dois temas e responsivas;
   - manchete, conquistas, contribuições reais;
   - estados de coleta, 404 e perfil vazio;
   - card e meta tags, badge, redirecionamento da v1;
   - aplicação da direção 1 do design kit (§5.3).
2. **Compartilhamento**:
   - comparação `/u/<a>...<b>`;
   - botões de compartilhar;
   - estados de cota e de organização;
   - sugestão de login no 404.
3. **Descoberta**:
   - galeria (curadas e Em alta);
   - contador semanal;
   - opção de não aparecer na galeria.
