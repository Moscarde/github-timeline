import { usernameKey } from '../domain/username.js';
import type { CollectionProgress } from '../github/collector.js';

/** Evento publicado para quem acompanha uma coleta via SSE. */
export type ProgressEvent =
  | ({ type: 'progress' } & CollectionProgress)
  | { type: 'done' }
  | { type: 'not_found' }
  | { type: 'failed'; reason: string };

export type ProgressSubscriber = (event: ProgressEvent) => void;

/**
 * Distribui o progresso de coletas por username para as conexões SSE abertas.
 * @example const stop = hub.subscribe('torvalds', (event) => send(event));
 */
export class ProgressHub {
  private readonly subscribers = new Map<string, Set<ProgressSubscriber>>();

  subscribe(username: string, subscriber: ProgressSubscriber): () => void {
    const key = usernameKey(username);
    const set = this.subscribers.get(key) ?? new Set<ProgressSubscriber>();
    set.add(subscriber);
    this.subscribers.set(key, set);
    return () => this.unsubscribe(key, subscriber);
  }

  publish(username: string, event: ProgressEvent): void {
    for (const subscriber of this.subscribers.get(usernameKey(username)) ?? []) subscriber(event);
  }

  private unsubscribe(key: string, subscriber: ProgressSubscriber): void {
    const set = this.subscribers.get(key);
    set?.delete(subscriber);
    if (set?.size === 0) this.subscribers.delete(key);
  }
}
