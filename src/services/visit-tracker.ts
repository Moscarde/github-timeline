import { createHash } from 'node:crypto';
import type { VisitStore } from '../storage/visit-store.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_DAYS = 7;
const RETENTION_DAYS = 30;

export interface VisitTrackerDeps {
  store: VisitStore;
  /** Segredo do hash; sem ele, o hash diário do IP seria reversível por força bruta. */
  salt: string;
  now: () => Date;
}

/**
 * Registra visitas com hash diário do IP e responde o contador semanal e "Em alta" (§2.1, §8).
 * @example tracker.record('torvalds', '203.0.113.7'); tracker.weeklyCount();
 */
export class VisitTracker {
  private purgedDay = '';

  constructor(private readonly deps: VisitTrackerDeps) {}

  record(username: string, ip: string): void {
    const day = dayOf(this.deps.now());
    const visitor = createHash('sha256').update(`${day}|${ip}|${this.deps.salt}`).digest('hex');
    this.deps.store.record({ username, day, visitor: visitor.slice(0, 32) });
    this.purgeOncePerDay(day);
  }

  /** "N timelines geradas esta semana": janela móvel de 7 dias, incluindo hoje. */
  weeklyCount(): number {
    return this.deps.store.countSince(this.daysAgo(WEEK_DAYS - 1));
  }

  /** Usernames mais visitados na janela de 7 dias. */
  trending(limit: number): string[] {
    return this.deps.store.topSince(this.daysAgo(WEEK_DAYS - 1), limit);
  }

  private purgeOncePerDay(day: string): void {
    if (this.purgedDay === day) return;
    this.purgedDay = day;
    this.deps.store.purgeBefore(this.daysAgo(RETENTION_DAYS));
  }

  private daysAgo(days: number): string {
    return dayOf(new Date(this.deps.now().getTime() - days * DAY_MS));
  }
}

/**
 * Dia UTC no formato AAAA-MM-DD.
 * @example dayOf(new Date('2026-09-30T23:00:00Z')) // "2026-09-30"
 */
export function dayOf(date: Date): string {
  return date.toISOString().slice(0, 10);
}
