/** Host canônico (§9): URLs absolutas nunca são derivadas de cabeçalhos da requisição. */
export const CANONICAL_ORIGIN = 'https://github-timeline.frangolab.com';

/** Host exibido no card e nos campos de link, ex.: "github-timeline.frangolab.com". */
export const CANONICAL_HOST = new URL(CANONICAL_ORIGIN).host;

/** Repositório do projeto: botão "Star" da landing e link "código" do rodapé. */
export const PROJECT_REPO = 'Moscarde/github-timeline';
export const PROJECT_URL = `https://github.com/${PROJECT_REPO}`;

export interface AppConfig {
  githubToken: string;
  port: number;
  databasePath: string;
  /** Sal do hash diário de IP das visitas (§8); opcional. */
  visitSalt: string | null;
}

/**
 * Lê a configuração do ambiente; o token só existe em variável de ambiente (§8).
 * @example const config = loadConfig(process.env);
 */
export function loadConfig(env: NodeJS.ProcessEnv): AppConfig {
  const githubToken = env.GITHUB_TOKEN?.trim();
  if (!githubToken) {
    throw new Error('GITHUB_TOKEN ausente: defina um token do GitHub (classic sem escopos basta).');
  }
  return {
    githubToken,
    port: parsePort(env.PORT),
    databasePath: env.DATABASE_PATH ?? 'timeline.db',
    visitSalt: env.VISIT_SALT?.trim() || null,
  };
}

function parsePort(raw: string | undefined): number {
  if (raw === undefined || raw === '') return 3000;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT inválida: recebido "${raw}", esperado inteiro entre 1 e 65535.`);
  }
  return port;
}
