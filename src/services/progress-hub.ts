import { loginKey } from '../domain/login.js';
import type { CollectionProgress } from '../github/collector.js';

/** Evento publicado para quem acompanha uma coleta via SSE. */
export type ProgressEvent =
  | ({ type: 'progress' } & CollectionProgress)
  | { type: 'done' }
  | { type: 'not_found' }
  | { type: 'failed'; reason: string };

export type ProgressSubscriber = (event: ProgressEvent) => void;

/**
 * Distribui o progresso de coletas por login para as conexões SSE abertas.
 * @example const stop = hub.subscribe('torvalds', (event) => send(event));
 */
export class ProgressHub {
  private readonly subscribers = new Map<string, Set<ProgressSubscriber>>();

  subscribe(login: string, subscriber: ProgressSubscriber): () => void {
    const key = loginKey(login);
    const set = this.subscribers.get(key) ?? new Set<ProgressSubscriber>();
    set.add(subscriber);
    this.subscribers.set(key, set);
    return () => this.unsubscribe(key, subscriber);
  }

  publish(login: string, event: ProgressEvent): void {
    for (const subscriber of this.subscribers.get(loginKey(login)) ?? []) subscriber(event);
  }

  private unsubscribe(key: string, subscriber: ProgressSubscriber): void {
    const set = this.subscribers.get(key);
    set?.delete(subscriber);
    if (set?.size === 0) this.subscribers.delete(key);
  }
}
