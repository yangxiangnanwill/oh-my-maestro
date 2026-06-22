// Maestro IDE — Delegate Executor (Subprocess Management + Output Stream Parsing)

import { spawn, type ChildProcess } from 'node:child_process';
import type { EventBus } from './event-bus.js';
import type { DelegateEvent } from '../shared/types.js';
import { WorkflowEvents, Channels } from '../shared/events.js';

/** Active process tracking entry */
interface ActiveProcess {
  process: ChildProcess;
  executionId: string;
  callbacks: Set<(event: DelegateEvent) => void>;
}

/** Spawn function signature — matches node:child_process.spawn */
export type SpawnFn = (
  command: string,
  args: readonly string[],
) => ChildProcess;

/** Map from DelegateEvent.type to WorkflowEvents constant */
const DELEGATE_TO_WORKFLOW_EVENT: Record<DelegateEvent['type'], string> = {
  queued: WorkflowEvents.EXECUTION_STARTED,
  started: WorkflowEvents.STEP_UPDATE,
  completed: WorkflowEvents.EXECUTION_COMPLETED,
  failed: WorkflowEvents.EXECUTION_FAILED,
};

/**
 * DelegateExecutor — manages `maestro delegate` subprocess lifecycle.
 *
 * Spawns delegate processes, parses NDJSON stdout line-by-line into
 * DelegateEvent objects, and publishes to EventBus for WebSocket gateway.
 */
export class DelegateExecutor {
  private activeProcesses = new Map<string, ActiveProcess>();
  private eventCounter = 0;
  private globalCallbacks = new Set<(event: DelegateEvent) => void>();

  constructor(
    private eventBus: EventBus,
    private spawnFn: SpawnFn = spawn,
  ) {}

  /**
   * Execute a delegate workflow.
   * Spawns `maestro delegate <prompt> --to <tool> --mode <mode>`
   * and returns the executionId for tracking.
   *
   * @param workflowId - Workflow ID or prompt string
   * @param params - Parameters for the workflow
   * @param mode - Execution mode: 'write' (default) or 'analysis' (dry-run)
   */
  execute(
    workflowId: string,
    params: Record<string, unknown>,
    mode: 'write' | 'analysis' = 'write',
  ): string {
    const executionId = `exec-${++this.eventCounter}-${Date.now()}`;

    // Build delegate prompt from workflowId + params
    const prompt = this.buildPrompt(workflowId, params);

    // Determine tool from params or default to 'claude'
    const tool = (params.tool as string) ?? 'claude';

    // Spawn the maestro delegate process
    const childProcess = this.spawnFn('maestro', [
      'delegate',
      prompt,
      '--to',
      tool,
      '--mode',
      mode,
    ]);

    const callbacks = new Set<(event: DelegateEvent) => void>();

    // Store in active processes map
    this.activeProcesses.set(executionId, {
      process: childProcess,
      executionId,
      callbacks,
    });

    // Parse stdout line-by-line
    childProcess.stdout?.on('data', (chunk: Buffer | string) => {
      const text = typeof chunk === 'string' ? chunk : chunk.toString();
      for (const line of text.split('\n')) {
        const event = this.parseLine(line);
        if (event) {
          this.emitEvent(event);
        }
      }
    });

    // Handle stderr
    childProcess.stderr?.on('data', (chunk: Buffer | string) => {
      const text = typeof chunk === 'string' ? chunk : chunk.toString();
      console.error(`[DelegateExecutor:${executionId}] stderr:`, text);
    });

    // Handle process exit
    childProcess.on('exit', (code) => {
      const entry = this.activeProcesses.get(executionId);
      if (entry) {
        this.activeProcesses.delete(executionId);
      }

      // If exited with non-zero code and no prior failed event, emit one
      if (code !== null && code !== 0) {
        const failedEvent: DelegateEvent = {
          type: 'failed',
          executionId,
          output: `Process exited with code ${code}`,
          timestamp: new Date().toISOString(),
        };
        this.emitEvent(failedEvent);
      }
    });

    return executionId;
  }

  /**
   * Execute a dry-run analysis.
   * Spawns `maestro delegate <prompt> --to <tool> --mode analysis`
   * and collects raw stdout as a string (no NDJSON parsing).
   *
   * @param prompt - The delegate prompt string
   * @param tool - The CLI tool to use (default 'claude')
   * @returns Promise that resolves with full stdout output
   */
  executeDryRun(prompt: string, tool: string = 'claude'): Promise<string> {
    return new Promise((resolve, reject) => {
      const childProcess = this.spawnFn('maestro', [
        'delegate',
        prompt,
        '--to',
        tool,
        '--mode',
        'analysis',
      ]);

      const stdoutChunks: string[] = [];

      childProcess.stdout?.on('data', (chunk: Buffer | string) => {
        const text = typeof chunk === 'string' ? chunk : chunk.toString();
        stdoutChunks.push(text);
      });

      childProcess.stderr?.on('data', (chunk: Buffer | string) => {
        const text = typeof chunk === 'string' ? chunk : chunk.toString();
        console.error(`[DelegateExecutor:dry-run] stderr:`, text);
      });

      childProcess.on('exit', (code) => {
        const fullOutput = stdoutChunks.join('');
        if (code !== null && code !== 0) {
          // Non-zero exit — still resolve with collected output (may contain error info)
          console.warn(
            `[DelegateExecutor:dry-run] Process exited with code ${code}`,
          );
          resolve(fullOutput || `Process exited with code ${code}`);
        } else {
          resolve(fullOutput);
        }
      });

      childProcess.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Register a callback to receive all DelegateEvent objects.
   * Returns an unsubscribe function.
   */
  onEvent(callback: (event: DelegateEvent) => void): () => void {
    this.globalCallbacks.add(callback);
    return () => {
      this.globalCallbacks.delete(callback);
    };
  }

  /**
   * Stop a running delegate execution.
   * Kills the child process and removes it from tracking.
   */
  stop(executionId: string): void {
    const entry = this.activeProcesses.get(executionId);
    if (entry) {
      entry.process.kill();
      this.activeProcesses.delete(executionId);
    }
  }

  /**
   * Parse a single stdout line into a DelegateEvent.
   * Returns null for empty/whitespace lines or invalid JSON.
   */
  private parseLine(line: string): DelegateEvent | null {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      return null;
    }

    try {
      const parsed = JSON.parse(trimmed);
      return {
        type: parsed.type,
        executionId: parsed.executionId,
        stepIndex: parsed.stepIndex,
        stepName: parsed.stepName,
        output: parsed.output,
        timestamp: parsed.timestamp,
      } satisfies DelegateEvent;
    } catch {
      return null;
    }
  }

  /**
   * Emit a DelegateEvent to all registered callbacks and EventBus.
   */
  private emitEvent(event: DelegateEvent): void {
    // Notify global callbacks
    for (const cb of this.globalCallbacks) {
      try {
        cb(event);
      } catch (err) {
        console.error('[DelegateExecutor] Error in event callback:', err);
      }
    }

    // Notify per-execution callbacks
    const entry = this.activeProcesses.get(event.executionId);
    if (entry) {
      for (const cb of entry.callbacks) {
        try {
          cb(event);
        } catch (err) {
          console.error('[DelegateExecutor] Error in execution callback:', err);
        }
      }
    }

    // Map to WorkflowEvents and publish to EventBus
    const workflowEvent = DELEGATE_TO_WORKFLOW_EVENT[event.type];
    if (workflowEvent) {
      this.eventBus.publish(
        workflowEvent,
        Channels.WORKFLOW,
        { ...event },
        'server',
      );
    }
  }

  /**
   * Build the delegate prompt string from workflowId and params.
   */
  private buildPrompt(workflowId: string, params: Record<string, unknown>): string {
    const paramsStr = Object.entries(params)
      .filter(([key]) => key !== 'tool') // tool is passed as --to flag
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join(' ');
    return paramsStr ? `${workflowId} ${paramsStr}` : workflowId;
  }
}
