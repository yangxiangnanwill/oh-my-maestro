// Maestro IDE — Concept Translator Middleware

import type { DisplayMode } from '../shared/types.js';
import { translate, shouldHide, translatePayload, TRANSLATIONS, type TranslationEntry } from '../shared/translations.js';
import type { EventBus } from './event-bus.js';
import { Channels, DialogEvents } from '../shared/events.js';

/**
 * Concept Translator middleware for server-side response processing.
 * Intercepts all outbound data and applies terminology translation
 * based on the requesting client's display mode.
 */
export class TranslatorMiddleware {
  /** Client display modes keyed by WebSocket connection ID */
  private clientModes = new Map<string, DisplayMode>();

  constructor(private eventBus: EventBus) {}

  /**
   * Register a client's display mode.
   * Called when a client connects or switches mode.
   */
  setClientMode(clientId: string, mode: DisplayMode): void {
    this.clientModes.set(clientId, mode);
  }

  /**
   * Get a client's display mode.
   */
  getClientMode(clientId: string): DisplayMode {
    return this.clientModes.get(clientId) ?? 'simple';
  }

  /**
   * Remove a client's mode tracking on disconnect.
   */
  removeClient(clientId: string): void {
    this.clientModes.delete(clientId);
  }

  /**
   * Check if a channel should be translated.
   * DIALOG channel is whitelisted — its payloads are raw chat messages
   * and should not be altered by the concept translator.
   */
  shouldTranslateChannel(channel: string): boolean {
    return channel !== Channels.DIALOG;
  }

  /**
   * Translate a response payload for a specific client.
   * Returns a new object with translated keys/labels and
   * a list of terms that couldn't be translated.
   *
   * DIALOG channel payloads are whitelisted — they contain raw chat
   * messages and should not be altered by the concept translator.
   */
  translate<T extends Record<string, unknown>>(
    payload: T,
    clientId: string
  ): { translated: T; untranslatedTerms: string[]; mode: DisplayMode } {
    // DIALOG channel whitelist: skip translation for chat messages
    if (this.isDialogPayload(payload)) {
      const mode = this.getClientMode(clientId);
      return { translated: payload, untranslatedTerms: [], mode };
    }

    const mode = this.getClientMode(clientId);
    const { translated, untranslatedTerms } = translatePayload(payload, mode);
    return { translated, untranslatedTerms, mode };
  }

  /**
   * Check if a payload belongs to the DIALOG channel.
   * DIALOG payloads contain sessionId AND one of:
   *   - a StreamChunk type field ('text'|'tool_use'|'tool_result'|'error')
   *   - intent routing fields (workflowId, confidence)
   *   - a session creation/closure marker
   *
   * Gate payloads (which also have gateId-like fields) are NOT Dialog payloads
   * and must not be skipped from translation.
   */
  private isDialogPayload(payload: Record<string, unknown>): boolean {
    // Must have sessionId
    if (typeof payload.sessionId !== 'string') return false;

    // Stream chunk: has 'type' field matching StreamChunk types
    const validChunkTypes = new Set(['text', 'tool_use', 'tool_result', 'error']);
    if (typeof payload.type === 'string' && validChunkTypes.has(payload.type as string)) {
      return true;
    }

    // Intent routed: has workflowId or confidence fields
    if ('workflowId' in payload || 'confidence' in payload) {
      return true;
    }

    // Session created/closed markers
    if ('clientId' in payload && 'session' in payload) return true;
    if ('status' in payload && payload.status === 'closed') return true;

    // Not a recognizable Dialog payload
    return false;
  }

  /**
   * Check if a term should be hidden for a client.
   */
  shouldHide(term: string, clientId: string): boolean {
    const mode = this.getClientMode(clientId);
    return shouldHide(term, mode);
  }

  /**
   * Translate a single term for a client.
   */
  translateTerm(term: string, clientId: string): string {
    const mode = this.getClientMode(clientId);
    return translate(term, mode);
  }

  /**
   * Get all translation entries (for client-side cache sync).
   */
  getTranslations(): TranslationEntry[] {
    return [...TRANSLATIONS];
  }

  /**
   * Get translation coverage stats.
   */
  getStats(): { totalTerms: number; hiddenInSimple: number; categories: Record<string, number> } {
    const categories: Record<string, number> = {};
    let hiddenCount = 0;

    for (const entry of TRANSLATIONS) {
      categories[entry.category] = (categories[entry.category] ?? 0) + 1;
      if (entry.hiddenInSimpleMode) hiddenCount++;
    }

    return {
      totalTerms: TRANSLATIONS.length,
      hiddenInSimple: hiddenCount,
      categories,
    };
  }
}
