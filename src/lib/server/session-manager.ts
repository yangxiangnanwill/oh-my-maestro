// Maestro IDE — Generic Session Manager Base Class
//
// Extracted from TerminalManager and DialogManager to share common
// session CRUD patterns (sessions Map, MAX_SESSIONS, getSessionCount, hasSession).
// Subclasses provide their own session data type via generic parameter <T>.

/**
 * Generic abstract base class for session managers.
 * Provides shared session storage, capacity management, and accessor methods.
 *
 * @typeParam T - The session data type (e.g., ActiveTerminal, ActiveDialog).
 *                Subclasses define their own internal tracking structure.
 */
export abstract class SessionManager<T> {
  protected sessions: Map<string, T> = new Map();
  protected readonly MAX_SESSIONS: number;

  /**
   * @param maxSessions - Maximum concurrent sessions allowed (default: 5)
   */
  constructor(maxSessions: number = 5) {
    this.MAX_SESSIONS = maxSessions;
  }

  /**
   * Get the number of active sessions.
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Check if a session exists by ID.
   */
  hasSession(id: string): boolean {
    return this.sessions.has(id);
  }

  /**
   * Throw an Error if the session limit has been reached.
   * Subclasses should call this before creating a new session.
   *
   * @param label - Session type label for the error message (e.g., "terminal", "dialog")
   */
  protected checkMaxSessions(label?: string): void {
    if (this.sessions.size >= this.MAX_SESSIONS) {
      const prefix = label ? `${label} ` : '';
      throw new Error(`Maximum ${prefix}sessions (${this.MAX_SESSIONS}) reached`);
    }
  }
}
