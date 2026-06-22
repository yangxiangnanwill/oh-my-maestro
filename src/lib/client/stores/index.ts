// Maestro IDE — Svelte Stores (Reactive State)

import { WSClient } from '../services/ws-client.js';

// WebSocket client singleton
export const wsClient = new WSClient('ws://localhost:3001');

// Auto-connect once on initialization (WSClient handles reconnection internally)
if (typeof window !== 'undefined') {
  wsClient.connect();
}

// Connection state — WSClient uses $state runes, not Svelte stores.
// Wrap in a writable that syncs from WSClient's reactive getters.
import { writable, derived } from 'svelte/store';
import type { ProjectState, DisplayMode, WorkflowExecution, Recommendation, DelegateEvent, ExecutionStep, WorkflowStatus, TerminalSession, DialogSession, StreamChunk, IntentResult, StepStatus } from '../../shared/types.js';
import { Channels, TerminalEvents, DialogEvents } from '../../shared/events.js';

const connectionWritable = writable({ connected: false, mode: 'simple' as DisplayMode, clientId: null as string | null });

// Event-driven connection state sync — replaces 500ms polling with callback-based updates
if (typeof window !== 'undefined') {
  wsClient.onStateChange((state) => {
    connectionWritable.set(state);
  });
}

export const connectionState = derived(connectionWritable, ($state) => $state);

// Display mode
export const displayMode = writable<DisplayMode>('simple');

// Project state
export const projectState = writable<ProjectState>({
  projectId: '',
  milestones: [],
});

// Active workflow executions
export const activeWorkflows = writable<WorkflowExecution[]>([]);

// Accumulate DelegateEvent stream into WorkflowExecution objects
const executionMap = new Map<string, WorkflowExecution>();

// Recommendations
export const recommendations = writable<Recommendation[]>([]);

// Terminal sessions
export const terminalSessions = writable<TerminalSession[]>([]);

// Dialog sessions — keyed by sessionId
export const dialogSessions = writable<DialogSession[]>([]);

// Dialog chat messages — accumulated stream chunks per session
export interface DialogMessage {
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: StreamChunk['type'];
  timestamp: string;
}

export const dialogMessages = writable<DialogMessage[]>([]);

// Dialog intent routing results — latest per session
export interface DialogIntentState {
  sessionId: string;
  intent: IntentResult;
  timestamp: string;
}

export const dialogIntents = writable<DialogIntentState[]>([]);

// Subscribe to WebSocket events and update stores
wsClient.on(Channels.STATE, (message) => {
  if (message.type === 'state:sync') {
    const event = (message.payload as { event: { type: string; payload: Record<string, unknown> } }).event;
    if (event.type === 'project:state-update' || event.type === 'project:milestone-changed') {
      // Update project state from sync events
      const state = event.payload as unknown as ProjectState;
      if (state.projectId) {
        projectState.set(state);
      }
    }
  }
});

wsClient.on(Channels.WORKFLOW, (message) => {
  if (message.type === 'workflow:step-update') {
    // Extract DelegateEvent fields from payload (not WorkflowExecution)
    const event = (message.payload as unknown) as DelegateEvent;
    const { executionId, type, stepIndex, stepName, output, timestamp } = event;

    // Look up or create WorkflowExecution in the accumulation map
    let execution = executionMap.get(executionId);
    if (!execution) {
      execution = {
        id: executionId,
        workflowId: '',
        params: {},
        status: 'running' as WorkflowStatus,
        steps: [],
        startedAt: timestamp,
        completedAt: null,
      };
    }

    // Prevent overwriting terminal status (protects against out-of-order events)
    if (execution.status !== 'completed' && execution.status !== 'failed' && execution.status !== 'cancelled') {
      switch (type) {
        case 'queued':
        case 'started':
          execution.status = 'running';
          break;
        case 'completed':
          execution.status = 'completed';
          execution.completedAt = timestamp;
          break;
        case 'failed':
          execution.status = 'failed';
          execution.completedAt = timestamp;
          break;
      }
    }

    // Convert DelegateEvent to ExecutionStep if stepIndex/stepName are present
    if (stepIndex !== undefined && stepName !== undefined) {
      const STEP_STATUS_MAP: Record<string, StepStatus> = {
        queued: 'pending',
        started: 'running',
        completed: 'complete',
        failed: 'failed',
      };
      const step: ExecutionStep = {
        index: stepIndex,
        name: stepName,
        status: STEP_STATUS_MAP[type] ?? 'pending',
        output,
        startedAt: timestamp,
        completedAt: timestamp,
      };

      // Check if we already have this step index — if so, update it; otherwise push
      const existingIdx = execution.steps.findIndex((s) => s.index === stepIndex);
      if (existingIdx >= 0) {
        execution.steps[existingIdx] = step;
      } else {
        execution.steps.push(step);
      }
    }

    // Save back to map
    executionMap.set(executionId, execution);

    // Update activeWorkflows store
    activeWorkflows.update((workflows) => {
      const idx = workflows.findIndex((w) => w.id === executionId);
      if (idx >= 0) {
        workflows[idx] = execution;
      } else {
        workflows.push(execution);
      }
      return workflows;
    });
  }
});

wsClient.on(Channels.PROJECT, (message) => {
  if (message.type === 'project:state-update') {
    const state = (message.payload as unknown as ProjectState);
    if (state.projectId) {
      projectState.set(state);
    }
  }
});

// Subscribe to TERMINAL channel events and update terminalSessions store
wsClient.on(Channels.TERMINAL, (message) => {
  switch (message.type) {
    case TerminalEvents.CREATED: {
      const payload = message.payload as { terminalId: string; session: TerminalSession };
      terminalSessions.update((sessions) => {
        const existing = sessions.findIndex((s) => s.terminalId === payload.terminalId);
        if (existing >= 0) {
          sessions[existing] = payload.session;
        } else {
          sessions.push(payload.session);
        }
        return sessions;
      });
      break;
    }
    case TerminalEvents.EXIT: {
      const payload = message.payload as { terminalId: string; exitCode: number | null };
      terminalSessions.update((sessions) => {
        const idx = sessions.findIndex((s) => s.terminalId === payload.terminalId);
        if (idx >= 0) {
          sessions[idx] = { ...sessions[idx], status: 'exited' };
        }
        return sessions;
      });
      break;
    }
  }
});

// Subscribe to DIALOG channel events
wsClient.on(Channels.DIALOG, (message) => {
  switch (message.type) {
    case DialogEvents.SESSION_CREATED: {
      const payload = message.payload as { sessionId: string; clientId: string; session: DialogSession };
      dialogSessions.update((sessions) => {
        const existing = sessions.findIndex((s) => s.sessionId === payload.sessionId);
        if (existing >= 0) {
          sessions[existing] = payload.session;
        } else {
          sessions.push(payload.session);
        }
        return sessions;
      });
      break;
    }

    case DialogEvents.STREAM_CHUNK: {
      const payload = message.payload as { sessionId: string; type: StreamChunk['type']; content: string; timestamp: string };
      const msg: DialogMessage = {
        sessionId: payload.sessionId,
        role: 'assistant',
        content: payload.content,
        type: payload.type,
        timestamp: payload.timestamp,
      };
      dialogMessages.update((msgs) => [...msgs, msg]);
      break;
    }

    case DialogEvents.INTENT_ROUTED: {
      const payload = message.payload as {
        sessionId: string;
        workflowId: string | null;
        confidence: number;
        candidates?: { workflowId: string; score: number }[];
      };
      const intentState: DialogIntentState = {
        sessionId: payload.sessionId,
        intent: {
          workflowId: payload.workflowId,
          confidence: payload.confidence,
          candidates: payload.candidates ?? [],
        },
        timestamp: message.timestamp,
      };
      dialogIntents.update((intents) => {
        const existing = intents.findIndex((i) => i.sessionId === payload.sessionId);
        if (existing >= 0) {
          intents[existing] = intentState;
        } else {
          intents.push(intentState);
        }
        return intents;
      });
      break;
    }

    case DialogEvents.SESSION_CLOSED: {
      const payload = message.payload as { sessionId: string };
      dialogSessions.update((sessions) =>
        sessions.map((s) =>
          s.sessionId === payload.sessionId ? { ...s, status: 'closed' as const } : s,
        ),
      );
      break;
    }
  }
});

// Sync display mode to WebSocket
displayMode.subscribe(($mode) => {
  wsClient.setMode($mode);
});
