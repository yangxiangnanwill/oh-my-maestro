// Maestro IDE — EventBus (Publish/Subscribe)

import type { EventType } from '../shared/events.js';

/** Event subscriber callback */
export type EventCallback<T = unknown> = (payload: T, event: InternalEvent<T>) => void;

/** Internal event representation */
export interface InternalEvent<T = unknown> {
  id: string;
  type: EventType | string;
  channel: string;
  payload: T;
  timestamp: string;
  source: 'server' | 'client';
}

/**
 * EventBus — central pub/sub for all server-side events.
 * Supports typed subscriptions, wildcard listeners, and event history.
 */
export class EventBus {
  private subscribers = new Map<string, Set<EventCallback>>();
  private wildcardSubscribers = new Set<EventCallback>();
  private history: InternalEvent[] = [];
  private maxHistory = 100;
  private eventCounter = 0;

  /**
   * Subscribe to events of a specific type.
   * Returns an unsubscribe function.
   */
  subscribe<T = unknown>(eventType: string, callback: EventCallback<T>): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    const typedCallback = callback as EventCallback;
    this.subscribers.get(eventType)!.add(typedCallback);

    return () => {
      this.subscribers.get(eventType)?.delete(typedCallback);
    };
  }

  /**
   * Subscribe to ALL events (wildcard listener).
   * Returns an unsubscribe function.
   */
  onAny(callback: EventCallback): () => void {
    this.wildcardSubscribers.add(callback);
    return () => {
      this.wildcardSubscribers.delete(callback);
    };
  }

  /**
   * Publish an event to all matching subscribers.
   * @param options.skipHistory — 高频事件（term:output、dialog:stream-chunk）传入 true 跳过 history 写入
   */
  publish<T = unknown>(
    type: EventType | string,
    channel: string,
    payload: T,
    source: 'server' | 'client' = 'server',
    options?: { skipHistory?: boolean }
  ): InternalEvent<T> {
    const event: InternalEvent<T> = {
      id: `evt-${++this.eventCounter}-${Date.now()}`,
      type,
      channel,
      payload,
      timestamp: new Date().toISOString(),
      source,
    };

    // Store in history (skip for high-frequency events like term:output, dialog:stream-chunk)
    if (!options?.skipHistory) {
      this.history.push(event as InternalEvent);
      if (this.history.length > this.maxHistory) {
        this.history = this.history.slice(-this.maxHistory);
      }
    }

    // Notify type-specific subscribers
    const subs = this.subscribers.get(type);
    if (subs) {
      for (const cb of subs) {
        try {
          cb(payload, event as InternalEvent);
        } catch (err) {
          console.error(`[EventBus] Error in subscriber for ${type}:`, err);
        }
      }
    }

    // Notify wildcard subscribers
    for (const cb of this.wildcardSubscribers) {
      try {
        cb(payload, event as InternalEvent);
      } catch (err) {
        console.error(`[EventBus] Error in wildcard subscriber:`, err);
      }
    }

    return event;
  }

  /**
   * Get recent event history (optionally filtered by type).
   */
  getHistory(type?: string, limit = 50): InternalEvent[] {
    let events = type
      ? this.history.filter((e) => e.type === type)
      : this.history;
    return events.slice(-limit);
  }

  /**
   * Clear all subscribers and history.
   */
  clear(): void {
    this.subscribers.clear();
    this.wildcardSubscribers.clear();
    this.history = [];
  }

  /**
   * Get subscriber count for monitoring.
   */
  getSubscriberCount(type?: string): number {
    if (!type) {
      let total = this.wildcardSubscribers.size;
      for (const subs of this.subscribers.values()) {
        total += subs.size;
      }
      return total;
    }
    return (this.subscribers.get(type)?.size ?? 0) + this.wildcardSubscribers.size;
  }
}

/** Singleton EventBus instance */
export const eventBus = new EventBus();
