import type { Locale } from './locale.js';
import { translate } from './translate.js';

/** These templates adapt Portuguese snapshots without recollecting GitHub data. */
export const STORED_MESSAGES: ReadonlyArray<readonly [string, string]> = [
  ['{n0} ano. {n1} repositório.', '{n0} year. {n1} repository.'],
  ['{n0} ano. {n1} repositórios.', '{n0} year. {n1} repositories.'],
  ['{n0} anos. {n1} repositório.', '{n0} years. {n1} repository.'],
  ['{n0} anos. {n1} repositórios.', '{n0} years. {n1} repositories.'],
  ['{n0} ano de código.', '{n0} year of code.'],
  ['{n0} anos de código.', '{n0} years of code.'],
  ['{n0} ★ em {s1}.', '{n0} ★ on {s1}.'],
  ['De {s0} a {s1}.', 'From {s0} to {s1}.'],
  ['{n0} linguagens, {s1} primeiro.', '{n0} languages, {s1} first.'],
  ['Desde {s0}.', 'Since {s0}.'],
  ['Fiel ao {s0} desde {s1}.', 'Loyal to {s0} since {s1}.'],
  ['Começo com {l0}', 'Starting with {l0}'],
  ['Entram {l0}', 'Introducing {l0}'],
  ['Consolidação em {s0}', 'Consolidating {s0}'],
  ['{n0} repositório sem linguagem detectada', '{n0} repository with no detected language'],
  ['{n0} repositórios sem linguagem detectada', '{n0} repositories with no detected language'],
  ['repo mais antigo com ★: {s0}', 'oldest repo with ★: {s0}'],
  ['{n0} de {n1} ★', '{n0} of {n1} ★'],
  ['recebido · {s0}', 'received · {s0}'],
  ['{n0} de {n1} linguagens', '{n0} of {n1} languages'],
  ['{n0} linguagens', '{n0} languages'],
  ['faltam {n0} anos', '{n0} years to go'],
  ['falta 1 ano', '1 year to go'],
  ['desde {s0}', 'since {s0}'],
  ['{n0} de {n1}', '{n0} of {n1}'],
  ['criou {n0}× mais repositórios', 'created {n0}× as many repositories'],
  ['tem {n0}× mais stars', 'has {n0}× as many stars'],
  ['mesmo ano de estreia: {s0}', 'same debut year: {s0}'],
  ['começou {n0} ano antes', 'started {n0} year earlier'],
  ['começou {n0} anos antes', 'started {n0} years earlier'],
  ['{n0} linguagem em comum', '{n0} shared language'],
  ['{n0} linguagens em comum', '{n0} shared languages'],
];

const MONTHS: Readonly<Record<string, string>> = {
  jan: 'Jan',
  fev: 'Feb',
  mar: 'Mar',
  abr: 'Apr',
  mai: 'May',
  jun: 'Jun',
  jul: 'Jul',
  ago: 'Aug',
  set: 'Sep',
  out: 'Oct',
  nov: 'Nov',
  dez: 'Dec',
};

/** Convert formatted snapshot numbers only, leaving user content unchanged. @example storedNumber('1,4k') */
export function storedNumber(value: string): string {
  return value
    .replace(/\./g, ',')
    .replace(/,(\d)(k| mi|×|$)/, '.$1$2')
    .replace(' mi', 'm');
}

/** Translate known generated copy, never descriptions or repository names. @example translateStored('Entram Go e Rust', 'en') */
export function translateStored(source: string, locale: Locale): string {
  if (locale === 'pt-BR') return source;
  const staticText = translate(source, locale);
  if (staticText !== source) return staticText;
  const date = /^([a-z]{3}) (\d{4})$/.exec(source);
  if (date && MONTHS[date[1]!]) return `${MONTHS[date[1]!]!} ${date[2]}`;
  for (const [template, english] of STORED_MESSAGES) {
    const translated = matchStored(source, template, english);
    if (translated !== null) return translated;
  }
  return source;
}

function matchStored(source: string, template: string, english: string): string | null {
  const slots = [...template.matchAll(/\{([nsl]\d+)\}/g)].map((match) => match[1]!);
  const escaped = template.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
  const pattern = escaped.replace(/\{([nsl]\d+)\}/g, (_, slot: string) =>
    slot[0] === 'n' ? '([\\d.,]+(?:k| mi)?)' : '(.+?)',
  );
  const match = new RegExp(`^${pattern}$`).exec(source);
  if (!match) return null;
  return english.replace(/\{([nsl]\d+)\}/g, (_, slot: string) =>
    storedValue(slot, match[slots.indexOf(slot) + 1]!),
  );
}

function storedValue(slot: string, value: string): string {
  if (slot[0] === 'n') return storedNumber(value);
  if (slot[0] === 'l') return value.replace(/ e (?=[^,]+$)/, ' and ');
  return value;
}
