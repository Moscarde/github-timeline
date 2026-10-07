# Comandos do projeto. Rode `just` para listar.
# O .env é carregado em todas as receitas: `npm run dev` sozinho não o lê.

set dotenv-load := true

# Lista as receitas
default:
    @just --list --unsorted

# --- Desenvolvimento ---

# Instala as dependências exatas do package-lock
install:
    npm ci

# Servidor com recarga automática em http://localhost:${PORT:-3000}
dev:
    npm run dev

# Recompila o better-sqlite3 depois de trocar a versão do Node
rebuild-native:
    npm rebuild better-sqlite3

# Roda os testes
test *args:
    npm test -- {{ args }}

# Checagem de tipos
typecheck:
    npm run typecheck

# Lint
lint:
    npm run lint

# Formata o código com Prettier
format:
    npm run format

# Confere formatação, lint, tipos e testes antes de um PR
check:
    npx prettier --check .
    npm run lint
    npm run typecheck
    npm test

# --- Produção (Node) ---

# Compila o TypeScript para dist/
build:
    npm run build

# Compila e sobe o servidor compilado
start: build
    npm run start:prod

# Remove a saída do build
clean:
    rm -rf dist

# --- Produção (Docker) ---

# Constrói a imagem e sobe o contêiner em segundo plano
up:
    docker compose up -d --build

# Para o contêiner, mantendo o banco
down:
    docker compose down

# Acompanha os logs do contêiner
logs:
    docker compose logs -f timeline

# Para o contêiner e APAGA o volume com o banco SQLite
[confirm]
reset-db:
    docker compose down -v
