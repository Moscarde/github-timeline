import * as format from '../domain/format.js';
import { useLocale } from './view.js';

/** Format with the request locale. @example formatInteger(1000) */
export function formatInteger(value: number): string {
  return format.formatInteger(value, useLocale());
}

/** Format with the request locale. @example formatCompact(1000) */
export function formatCompact(value: number): string {
  return format.formatCompact(value, useLocale());
}

/** Format with the request locale. @example formatPercent(0.417) */
export function formatPercent(value: number): string {
  return format.formatPercent(value, useLocale());
}

/** Format with the request locale. @example plural(count, singular, pluralForm) */
export function plural(count: number, singular: string, pluralForm: string): string {
  return format.plural(count, singular, pluralForm, useLocale());
}

/** Format with the request locale. @example formatMonthYear('2026-01-01') */
export function formatMonthYear(iso: string): string {
  return format.formatMonthYear(iso, useLocale());
}

/** Format with the request locale. @example joinPt(items) */
export function joinPt(items: string[]): string {
  return format.joinPt(items, useLocale());
}

/** Format with the request locale. @example formatRatio(ratio) */
export function formatRatio(ratio: number): string {
  return format.formatRatio(ratio, useLocale());
}

/** Format with the request locale. @example monthNames() */
export function monthNames(): readonly string[] {
  return format.monthNames(useLocale());
}
