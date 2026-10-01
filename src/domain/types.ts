/** Tipo de conta devolvido por `GET /users/{username}`. */
export type AccountType = 'User' | 'Organization';

/** Perfil público, já normalizado a partir da API REST. */
export interface GithubAccount {
  username: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  htmlUrl: string;
  createdAt: string;
  type: AccountType;
}

/** Repositório público do perfil, com os campos usados pelas regras de derivação. */
export interface Repo {
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  forks: number;
  isFork: boolean;
  archived: boolean;
  homepage: string | null;
  sizeKb: number;
  createdAt: string;
  pushedAt: string | null;
  /** Data do fork mais antigo deste repositório, se alguém já o forkou. */
  firstForkAt: string | null;
}

/** Contribuições de commit em repositórios de organizações, num ano. */
export interface OrgContribution {
  year: number;
  repo: string;
  language: string | null;
  commits: number;
}

/** Contribuições públicas por ano: 12 posições, de janeiro a dezembro. */
export type MonthlyContributions = Record<number, number[]>;

/** Pessoa que contribui nos repositórios públicos de uma organização (§6). */
export interface OrgPerson {
  username: string;
  avatarUrl: string;
  contributions: number;
}

/** Resultado bruto da coleta (§3), antes da derivação. */
export interface CollectedProfile {
  account: GithubAccount;
  repos: Repo[];
  months: MonthlyContributions;
  orgContributions: OrgContribution[];
  /** Só em organizações: maiores contribuidores dos repositórios mais estrelados. */
  people?: OrgPerson[];
}

/** Contagem de ocorrências, ordenada da maior para a menor. */
export type Ranked = Array<[name: string, count: number]>;
