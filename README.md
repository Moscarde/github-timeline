# GitHub Timeline

Versão dinâmica do [Code Timeline](https://github.com/Moscarde/timeline): em vez de uma página curada à mão, qualquer perfil do GitHub vira uma linha do tempo ano a ano, montada no navegador a partir da API pública.

```
https://moscarde.github.io/github-timeline/<usuario>
```

## Como funciona

1. A rota `/github-timeline/<usuario>` não existe como arquivo — o GitHub Pages serve o `404.html`, que é cópia do `index.html`. O JS lê o usuário do path.
2. Duas chamadas REST (mais paginação): `GET /users/{u}` e `GET /users/{u}/repos`.
3. Tudo o que aparece é derivado dos **metadados dos repositórios** — data de criação, último push, linguagem, topics, descrição, stars, forks, homepage. Nada de texto inventado:
   - **capítulo** = ano de criação dos repositórios;
   - **título** = linguagens e topics que aparecem pela primeira vez naquele ano;
   - **parágrafo** = contagens do ano (repos, forks, linguagem predominante, topics, mais estrelado);
   - **repos em destaque** = top 6 do ano por score (stars, forks, descrição, topics, homepage, tamanho; forks e arquivados perdem pontos).
4. Resultado fica em `sessionStorage` por 30 min.

## Atividade mensal e token

Sem autenticação a API não expõe contribuições, e o limite é **60 requisições/hora por IP**. Por isso a grade mensal tem dois modos:

| modo | o que conta |
|---|---|
| sem token | eventos de repositório: criação + último push de cada repo no mês |
| com token | calendário de contribuições real (GraphQL `contributionsCollection`) |

O token é opcional, colado na própria página, salvo só no `localStorage` do navegador e enviado apenas para `api.github.com`. Um token *classic* sem nenhum escopo basta. Com ele, o limite sobe para 5.000/h.

Repositórios privados não aparecem: a API pública só lista os públicos.

## Stack

HTML, CSS e JavaScript puros. Sem build, sem dependências. Visual GitHub Primer com tema claro/escuro.

| arquivo | papel |
|---|---|
| `index.html` | shell + CSS |
| `404.html` | cópia do `index.html` (gerada por `scripts/sync-404.sh`) |
| `app.js` | rota, coleta, derivação e render |
| `scripts/serve.py` | servidor local que imita o fallback 404 do Pages |

## Próxima versão

A v2 sai do GitHub Pages para um servidor próprio, com contribuições reais, card de compartilhamento, badge e comparação de perfis. A especificação está em [docs/v2-especificacao.md](docs/v2-especificacao.md).

A marca própria **Timeline** usa a [direção 1 — Path of activity](reference/Timeline_Design_Kit/timeline_design_kit/direction-1-path-of-activity/) do design kit.

## v2 em desenvolvimento

Servidor Node + TypeScript (Hono, SQLite, Satori) em `src/`, com testes em `tests/`. Implementado até agora, da entrega 1 da especificação:

- coleta com o token do servidor, snapshot em SQLite com TTL de 12 h e uma coleta por login por vez;
- manchete, conquistas, linha do tempo e contribuições reais;
- `/`, `/u/<login>` (SSR, dois temas, responsiva), estados de coleta (SSE), 404 e perfil vazio;
- `/u/<login>/card.png`, meta tags Open Graph e `/badge/<login>.svg` com a marca Timeline.

```sh
npm install
GITHUB_TOKEN=<token> npm run dev   # http://localhost:3000/u/<login>
npm test                           # todos os testes
npm run typecheck && npm run lint
```

Um token *classic* sem escopos basta. Variáveis em `.env.example`.

## Rodar local (v1)

```sh
python3 scripts/serve.py        # http://localhost:8000/github-timeline/<usuario>
```

Depois de editar `index.html`, rode `scripts/sync-404.sh`.

O prefixo `github-timeline` está fixo em `index.html` (`REPO`) e em `scripts/serve.py` (`PREFIX`). Num fork com outro nome, ou num domínio próprio, ajuste os dois.
