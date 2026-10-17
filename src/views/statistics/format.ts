import { useLocale } from '../../i18n/view.js';

/** Format UTC days without browser timezone drift. @example statisticsDate('2026-10-17') */
export function statisticsDate(day: string): string {
  return new Intl.DateTimeFormat(useLocale(), {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${day}T12:00:00Z`));
}
