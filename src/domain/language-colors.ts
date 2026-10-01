/** Cores do GitHub Linguist para as linguagens mais comuns. */
const LANGUAGE_COLORS: Readonly<Record<string, string>> = {
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  'Jupyter Notebook': '#DA5B0B',
  Java: '#b07219',
  Kotlin: '#A97BFF',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  'Objective-C': '#438eff',
  Dart: '#00B4AB',
  Shell: '#89e051',
  PowerShell: '#012456',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Astro: '#ff5a03',
  Elixir: '#6e4a7e',
  Erlang: '#B83998',
  Haskell: '#5e5086',
  Scala: '#c22d40',
  Clojure: '#db5855',
  Lua: '#000080',
  R: '#198CE7',
  Julia: '#a270ba',
  Perl: '#0298c3',
  Dockerfile: '#384d54',
  Makefile: '#427819',
  Nix: '#7e7eff',
  'Vim Script': '#199f4b',
  'Emacs Lisp': '#c065db',
  TeX: '#3D6117',
  MDX: '#fcb32c',
  Handlebars: '#f7931e',
  Assembly: '#6E4C13',
  Zig: '#ec915c',
  OCaml: '#ef7a08',
  'F#': '#b845fc',
  Solidity: '#AA6746',
  HCL: '#844FBA',
  Groovy: '#4298b8',
  MATLAB: '#e16737',
  Elm: '#60B5CC',
};

const FALLBACK_COLOR = '#8b949e';

/**
 * Cor da linguagem para barras e pontos; linguagens fora do mapa usam cinza neutro.
 * @example languageColor('Go') // "#00ADD8"
 */
export function languageColor(language: string): string {
  return LANGUAGE_COLORS[language] ?? FALLBACK_COLOR;
}

/** Nomes de linguagens conhecidas, para descartar topics que só repetem a linguagem. */
export function knownLanguageNames(): string[] {
  return Object.keys(LANGUAGE_COLORS);
}
