/** Host canônico (§9): URLs absolutas nunca são derivadas de cabeçalhos da requisição. */
export const CANONICAL_ORIGIN = 'https://github-timeline.frangolab.com';

export interface AppConfig {
  githubToken: string;
  port: number;
  databasePath: string;
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
