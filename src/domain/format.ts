export const MONTHS_PT = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
] as const;

const integerFormat = new Intl.NumberFormat('pt-BR');
const decimalFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

/**
 * Inteiro com separador de milhar pt-BR.
 * @example formatInteger(1141) // "1.141"
 */
export function formatInteger(value: number): string {
  return integerFormat.format(value);
}

/**
 * Número compacto pt-BR, usado em stars e contagens grandes.
 * @example formatCompact(250712) // "250,7k"
 */
export function formatCompact(value: number): string {
  if (value < 1000) return integerFormat.format(value);
  const thousands = Math.round(value / 100) / 10;
  if (thousands < 1000) return `${decimalFormat.format(thousands)}k`;
  return `${decimalFormat.format(Math.round(value / 100_000) / 10)} mi`;
}

/**
 * Percentual com uma casa decimal.
 * @example formatPercent(0.417) // "41,7%"
 */
export function formatPercent(ratio: number): string {
  return `${decimalFormat.format(Math.round(ratio * 1000) / 10)}%`;
}

/**
 * Quantidade com o substantivo no singular ou plural.
 * @example plural(12, 'repositório', 'repositórios') // "12 repositórios"
 */
export function plural(count: number, singular: string, pluralForm: string): string {
  return `${formatInteger(count)} ${count === 1 ? singular : pluralForm}`;
}

/**
 * Mês abreviado e ano de uma data ISO, em UTC.
 * @example formatMonthYear('2014-03-02T10:00:00Z') // "mar 2014"
 */
export function formatMonthYear(iso: string): string {
  const date = new Date(iso);
  return `${MONTHS_PT[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/**
 * Junta itens com vírgulas e "e" antes do último.
 * @example joinPt(['Go', 'Rust', 'Zig']) // "Go, Rust e Zig"
 */
export function joinPt(items: string[]): string {
  if (items.length < 2) return items.join('');
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;
}

/** Ano UTC de uma data ISO. */
export function yearOf(iso: string): number {
  return new Date(iso).getUTCFullYear();
}

const MINUTE_MS = 60 * 1000;

/**
 * Idade relativa em pt-BR, para avisos de snapshot antigo.
 * @example formatAge(new Date('2026-09-30T09:00Z'), new Date('2026-09-30T12:00Z')) // "há 3 horas"
 */
export function formatAge(since: Date, now: Date): string {
  const minutes = Math.max(0, Math.floor((now.getTime() - since.getTime()) / MINUTE_MS));
  if (minutes < 1) return 'agora há pouco';
  if (minutes < 60) return `há ${plural(minutes, 'minuto', 'minutos')}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${plural(hours, 'hora', 'horas')}`;
  return `há ${plural(Math.floor(hours / 24), 'dia', 'dias')}`;
}
