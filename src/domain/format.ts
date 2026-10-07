import type { Locale } from '../i18n/locale.js';
import { translate } from '../i18n/translate.js';
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

const MONTHS_EN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const INTEGER_FORMATS: Readonly<Record<Locale, Intl.NumberFormat>> = {
  'pt-BR': new Intl.NumberFormat('pt-BR'),
  en: new Intl.NumberFormat('en'),
};
const DECIMAL_FORMATS: Readonly<Record<Locale, Intl.NumberFormat>> = {
  'pt-BR': new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }),
  en: new Intl.NumberFormat('en', { maximumFractionDigits: 1 }),
};

/** Localized month labels. @example monthNames('en')[1] // 'Feb' */
export function monthNames(locale: Locale = 'pt-BR'): readonly string[] {
  return locale === 'en' ? MONTHS_EN : MONTHS_PT;
}

/**
 * Inteiro com separador de milhar pt-BR.
 * @example formatInteger(1141) // "1.141"
 */
export function formatInteger(value: number, locale: Locale = 'pt-BR'): string {
  return INTEGER_FORMATS[locale].format(value);
}

/**
 * Número compacto pt-BR, usado em stars e contagens grandes.
 * @example formatCompact(250712) // "250,7k"
 */
export function formatCompact(value: number, locale: Locale = 'pt-BR'): string {
  if (value < 1000) return INTEGER_FORMATS[locale].format(value);
  const thousands = Math.round(value / 100) / 10;
  if (thousands < 1000) return `${DECIMAL_FORMATS[locale].format(thousands)}k`;
  return `${DECIMAL_FORMATS[locale].format(Math.round(value / 100_000) / 10)}${locale === 'en' ? 'm' : ' mi'}`;
}

/**
 * Percentual com uma casa decimal.
 * @example formatPercent(0.417) // "41,7%"
 */
export function formatPercent(ratio: number, locale: Locale = 'pt-BR'): string {
  return `${DECIMAL_FORMATS[locale].format(Math.round(ratio * 1000) / 10)}%`;
}

/**
 * Quantidade com o substantivo no singular ou plural.
 * @example plural(12, 'repositório', 'repositórios') // "12 repositórios"
 */
export function plural(
  count: number,
  singular: string,
  pluralForm: string,
  locale: Locale = 'pt-BR',
): string {
  return `${formatInteger(count, locale)} ${translate(count === 1 ? singular : pluralForm, locale)}`;
}

/**
 * Mês abreviado e ano de uma data ISO, em UTC.
 * @example formatMonthYear('2014-03-02T10:00:00Z') // "mar 2014"
 */
export function formatMonthYear(iso: string, locale: Locale = 'pt-BR'): string {
  const date = new Date(iso);
  return `${monthNames(locale)[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/**
 * Junta itens com vírgulas e "e" antes do último.
 * @example joinPt(['Go', 'Rust', 'Zig']) // "Go, Rust e Zig"
 */
export function joinPt(items: string[], locale: Locale = 'pt-BR'): string {
  if (items.length < 2) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${locale === 'en' ? 'and' : 'e'} ${items[items.length - 1]}`;
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
export function formatAge(since: Date, now: Date, locale: Locale = 'pt-BR'): string {
  const minutes = Math.max(0, Math.floor((now.getTime() - since.getTime()) / MINUTE_MS));
  if (minutes < 1) return locale === 'en' ? 'just now' : 'agora há pouco';
  if (minutes < 60) return relativeTime(minutes, 'minuto', 'minutos', locale);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return relativeTime(hours, 'hora', 'horas', locale);
  return relativeTime(Math.floor(hours / 24), 'dia', 'dias', locale);
}

/**
 * Quantas vezes maior, para os chips da comparação: uma casa abaixo de 10×, inteiro acima.
 * @example formatRatio(3.62) // "3,6×"
 */
export function formatRatio(ratio: number, locale: Locale = 'pt-BR'): string {
  return `${ratio < 10 ? DECIMAL_FORMATS[locale].format(ratio) : INTEGER_FORMATS[locale].format(Math.round(ratio))}×`;
}

function relativeTime(count: number, singular: string, pluralForm: string, locale: Locale): string {
  const elapsed = plural(count, singular, pluralForm, locale);
  return locale === 'en' ? `${elapsed} ago` : `há ${elapsed}`;
}
