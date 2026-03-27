// ============================================================
// CQRS base types
// ============================================================

export interface Command<T extends string = string, P = unknown> {
  readonly type: T;
  readonly payload: P;
}

export interface Query<T extends string = string, P = unknown> {
  readonly type: T;
  readonly payload: P;
}

export interface CommandHandler<C extends Command, R = void> {
  execute(command: C): Promise<R>;
}

export interface QueryHandler<Q extends Query, R = unknown> {
  execute(query: Q): Promise<R>;
}

// ============================================================
// Event bus for domain events
// ============================================================

import type { TwosomeEvent } from "@twosome/shared";

export type EventListener<E extends TwosomeEvent = TwosomeEvent> = (event: E) => void;

export interface EventBus {
  publish(event: TwosomeEvent): void;
  subscribe<T extends TwosomeEvent["type"]>(
    type: T,
    listener: EventListener<Extract<TwosomeEvent, { type: T }>>,
  ): () => void;
}

export class InMemoryEventBus implements EventBus {
  private listeners = new Map<string, Set<EventListener<any>>>();

  publish(event: TwosomeEvent): void {
    const set = this.listeners.get(event.type);
    if (set) {
      set.forEach((fn) => fn(event));
    }
  }

  subscribe<T extends TwosomeEvent["type"]>(
    type: T,
    listener: EventListener<Extract<TwosomeEvent, { type: T }>>,
  ): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    const set = this.listeners.get(type)!;
    set.add(listener);
    return () => set.delete(listener);
  }
}
