// Maestro IDE — Dialog Manager (Claude Code CLI Subprocess Management + NDJSON Streaming + Intent Routing)

import { spawn, type ChildProcess } from 'node:child_process';
import type { EventBus } from './event-bus.js';
import type { DialogSession, WorkflowMeta, StreamChunk, IntentResult, IntentCandidate } from '../shared/types.js';
import { Channels, DialogEvents } from '../shared/events.js';

/** Spawn function signature — compatible with node:child_process.spawn */
export type SpawnFn = (
  command: string,
  args?: readonly string[],
  options?: Parameters<typeof spawn>[2],
) => ChildProcess;

/** Active dialog tracking entry */
interface ActiveDialog {
  process: ChildProcess | null;
  session: DialogSession;
  buffer: string;
}

/**
 * DialogManager — manages Claude Code CLI subprocess lifecycle.
 *
 * Creates dialog sessions, spawns Claude Code CLI processes with NDJSON streaming,
 * parses output into StreamChunk events, and performs keyword-based intent recognition
 * to route user messages to appropriate workflows.
 */
export class DialogManager {
  private sessions = new Map<string, ActiveDialog>();
  private sessionCounter = 0;
  private readonly MAX_SESSIONS = 5;

  constructor(
    private eventBus: EventBus,
    private spawnFn: SpawnFn = spawn,
    private workflowRegistry: WorkflowMeta[] = [],
  ) {}

  /**
   * Create a new dialog session.
   * Throws Error if max sessions (5) already reached.
   */
  createSession(clientId: string): DialogSession {
    if (this.sessions.size >= this.MAX_SESSIONS) {
      throw new Error('Maximum dialog sessions (5) reached');
    }

    const sessionId = `dialog-${++this.sessionCounter}-${Date.now()}`;
    const now = new Date().toISOString();

    const session: DialogSession = {
      sessionId,
      cliProcessId: null,
      createdAt: now,
      lastActivityAt: now,
      status: 'active',
    };

    this.sessions.set(sessionId, {
      process: null,
      session,
      buffer: '',
    });

    this.eventBus.publish(
      DialogEvents.SESSION_CREATED,
      Channels.DIALOG,
      { sessionId, clientId, session },
      'server',
    );

    return session;
  }

  /**
   * Send a message to a dialog session.
   * Starts the Claude Code CLI subprocess if not already running,
   * then writes the message to stdin and runs intent detection.
   */
  sendMessage(sessionId: string, message: string): void {
    const activeDialog = this.sessions.get(sessionId);
    if (!activeDialog) {
      throw new Error(`Dialog session not found: ${sessionId}`);
    }

    activeDialog.session.lastActivityAt = new Date().toISOString();

    // Start CLI subprocess if not already running
    if (activeDialog.process === null) {
      this.spawnClaudeCLI(sessionId);
    }

    // Write message to CLI stdin
    const stdin = activeDialog.process?.stdin;
    if (stdin) {
      stdin.write(message + '\n');
    }

    // Run intent detection
    const intent = this.detectIntent(message);
    this.emitIntentRouted(sessionId, intent);
  }

  /**
   * Start the Claude Code CLI subprocess for a session.
   * Configures stdout NDJSON parsing, stderr logging, and exit handling.
   */
  private spawnClaudeCLI(sessionId: string): ChildProcess {
    const activeDialog = this.sessions.get(sessionId);
    if (!activeDialog) {
      throw new Error(`Dialog session not found: ${sessionId}`);
    }

    const childProcess = this.spawnFn('claude', [
      '--output-format',
      'stream-json',
      '--verbose',
    ]);

    activeDialog.process = childProcess;
    activeDialog.session.cliProcessId = childProcess.pid ?? null;

    // Parse stdout line-by-line as NDJSON
    childProcess.stdout?.on('data', (chunk: Buffer | string) => {
      const text = typeof chunk === 'string' ? chunk : chunk.toString();
      const lines = text.split('\n');

      for (const line of lines) {
        const streamChunk = this.parseChunk(line);
        if (streamChunk) {
          this.emitStreamChunk(sessionId, streamChunk);
        }
      }
    });

    // Log stderr
    childProcess.stderr?.on('data', (chunk: Buffer | string) => {
      const text = typeof chunk === 'string' ? chunk : chunk.toString();
      console.error(`[DialogManager:${sessionId}] stderr:`, text);
    });

    // Handle process exit
    childProcess.on('exit', (code) => {
      const dialog = this.sessions.get(sessionId);
      if (dialog) {
        dialog.session.status = 'closed';
        this.eventBus.publish(
          DialogEvents.SESSION_CLOSED,
          Channels.DIALOG,
          { sessionId, exitCode: code },
          'server',
        );
      }
    });

    return childProcess;
  }

  /**
   * Parse a single stdout line into a StreamChunk.
   * Returns null for empty/whitespace lines or invalid JSON —
   * stream-safe: silently skips partial writes.
   */
  private parseChunk(line: string): StreamChunk | null {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      return null;
    }

    try {
      const parsed = JSON.parse(trimmed);

      // Validate type field
      const validTypes = ['text', 'tool_use', 'tool_result', 'error'];
      if (!validTypes.includes(parsed.type)) {
        return null;
      }

      return {
        type: parsed.type,
        content: parsed.content ?? parsed.text ?? '',
        timestamp: parsed.timestamp ?? new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }

  /**
   * Publish a STREAM_CHUNK event to the EventBus.
   */
  private emitStreamChunk(sessionId: string, chunk: StreamChunk): void {
    this.eventBus.publish(
      DialogEvents.STREAM_CHUNK,
      Channels.DIALOG,
      { sessionId, ...chunk },
      'server',
    );
  }

  /**
   * Detect workflow intent from a user message using keyword matching.
   *
   * Scoring:
   * - Message contains workflow.name (case-insensitive) → +0.5
   * - Message contains keywords from workflow.description → +0.1 each
   * - Message contains workflow.category → +0.2
   * Scores are normalized to 0–1 range.
   *
   * Routing thresholds:
   * - confidence >= 0.8 → direct route (single workflowId)
   * - confidence 0.5–0.8 → disambiguation list (workflowId = null, top 3 candidates)
   * - confidence < 0.5 → no routing (empty candidates)
   */
  detectIntent(message: string): IntentResult {
    if (this.workflowRegistry.length === 0) {
      return { workflowId: null, confidence: 0, candidates: [] };
    }

    const lowerMessage = message.toLowerCase();
    const candidates: IntentCandidate[] = [];

    for (const workflow of this.workflowRegistry) {
      let score = 0;

      // Name match: +0.5
      if (lowerMessage.includes(workflow.name.toLowerCase())) {
        score += 0.5;
      }

      // Category match: +0.2
      if (lowerMessage.includes(workflow.category.toLowerCase())) {
        score += 0.2;
      }

      // Description keyword matches: +0.1 each
      const descKeywords = workflow.description.toLowerCase().split(/\s+/);
      for (const keyword of descKeywords) {
        if (keyword.length > 2 && lowerMessage.includes(keyword)) {
          score += 0.1;
        }
      }

      // Normalize to 0–1 and clamp
      const normalizedScore = Math.min(score, 1.0);

      if (normalizedScore > 0) {
        candidates.push({ workflowId: workflow.id, score: normalizedScore });
      }
    }

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);

    const top = candidates.slice(0, 3);
    const bestMatch = top.length > 0 ? top[0] : null;

    return {
      workflowId: bestMatch?.workflowId ?? null,
      confidence: bestMatch?.score ?? 0,
      candidates: top,
    };
  }

  /**
   * Emit INTENT_ROUTED event based on confidence threshold.
   * - >= 0.8: direct route with single workflowId
   * - 0.5–0.8: disambiguation list with workflowId = null
   * - < 0.5: no event emitted
   */
  private emitIntentRouted(sessionId: string, intent: IntentResult): void {
    if (intent.confidence >= 0.8) {
      this.eventBus.publish(
        DialogEvents.INTENT_ROUTED,
        Channels.DIALOG,
        {
          sessionId,
          workflowId: intent.workflowId,
          confidence: intent.confidence,
        },
        'server',
      );
    } else if (intent.confidence >= 0.5) {
      this.eventBus.publish(
        DialogEvents.INTENT_ROUTED,
        Channels.DIALOG,
        {
          sessionId,
          workflowId: null,
          confidence: intent.confidence,
          candidates: intent.candidates,
        },
        'server',
      );
    }
  }

  /**
   * Close a dialog session.
   * Kills the subprocess if running, deletes the session, and emits SESSION_CLOSED.
   */
  closeSession(sessionId: string): void {
    const activeDialog = this.sessions.get(sessionId);
    if (!activeDialog) return;

    if (activeDialog.process) {
      activeDialog.process.kill();
    }

    this.sessions.delete(sessionId);

    this.eventBus.publish(
      DialogEvents.SESSION_CLOSED,
      Channels.DIALOG,
      { sessionId },
      'server',
    );
  }

  /**
   * Update the internal workflow registry.
   * Used to refresh available workflows for intent detection.
   */
  updateWorkflowRegistry(workflows: WorkflowMeta[]): void {
    this.workflowRegistry = workflows;
  }

  /**
   * Get active session count.
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Check if a session exists.
   */
  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }
}
