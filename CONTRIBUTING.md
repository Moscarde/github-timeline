# Como contribuir

Obrigado pelo interesse! Este guia mostra como rodar o projeto, testar e hospedar a sua própria instância.

Para rodar o GitHub Timeline na sua máquina ou no seu servidor, você só precisa de um token do GitHub. Um token _classic_ **sem nenhum escopo** basta: ele só serve para subir o limite da API e liberar o calendário de contribuições.

## Com Docker

```sh
git clone https://github.com/Moscarde/github-timeline.git
cd github-timeline
cp .env.example .env        # preencha GITHUB_TOKEN
docker compose up -d --build
```

Pronto: `http://localhost:3000`. O banco SQLite fica no volume `timeline-data` e sobrevive a recriações do contêiner. A porta só escuta em `127.0.0.1`, pronta para ficar atrás de um proxy reverso (Nginx, Caddy, Traefik).

```sh
docker compose logs -f timeline   # acompanhar
docker compose down               # parar (com -v apaga o banco)
```

## Com Node

```sh
npm install
GITHUB_TOKEN=<token> npm run dev   # http://localhost:3000/u/<username>
```

Para produção: `npm run build && npm run start:prod`.

## Configuração

| Variável        | Para quê                                                                  | Padrão        |
| --------------- | ------------------------------------------------------------------------- | ------------- |
| `GITHUB_TOKEN`  | autenticar na API do GitHub (obrigatória)                                 | –             |
| `PORT`          | porta HTTP                                                                | `3000`        |
| `DATABASE_PATH` | arquivo SQLite dos snapshots e visitas                                    | `timeline.db` |
| `VISIT_SALT`    | sal do hash diário de IP; defina para manter as contagens entre reinícios | aleatório     |

Um passo a passo de deploy numa VPS com Nginx está em [`docs/deploy.md`](docs/deploy.md).

## Testes e qualidade

```sh
npm test                           # todos os testes
npm run typecheck && npm run lint  # tipos e lint
npm run format                     # Prettier
```

As convenções de código (tamanho de funções, testes, comentários) estão em [`AGENTS.md`](AGENTS.md).

## Enviando mudanças

1. Abra uma [issue](https://github.com/Moscarde/github-timeline/issues) para bugs ou ideias maiores, assim combinamos o caminho antes do código.
2. Crie um branch a partir de `main`, com testes para o que mudou.
3. Confira `npm test`, `npm run typecheck` e `npm run lint` e abra o pull request descrevendo o porquê da mudança.
