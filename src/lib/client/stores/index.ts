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
import type { ProjectState, DisplayMode, WorkflowExecution, Recommendation, DelegateEvent, ExecutionStep, WorkflowStatus } from '../../shared/types.js';
import { Channels } from '../../shared/events.js';

const connectionWritable = writable({ connected: false, mode: 'simple' as DisplayMode, clientId: null as string | null });

// Sync WSClient state into writable store on interval (polling approach for $state rune)
if (typeof window !== 'undefined') {
  let lastConnected = false;
  let lastMode: DisplayMode = 'simple';
  const syncInterval = setInterval(() => {
    const connected = wsClient.isConnected;
    const mode = wsClient.currentMode;
    const clientId = wsClient.currentClientId;
    if (connected !== lastConnected || mode !== lastMode) {
      lastConnected = connected;
      lastMode = mode;
      connectionWritable.set({ connected, mode, clientId });
    }
  }, 500);
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
      const step: ExecutionStep = {
        index: stepIndex,
        name: stepName,
        status: type === 'failed' ? 'failed' : 'complete',
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

// Sync display mode to WebSocket
displayMode.subscribe(($mode) => {
  wsClient.setMode($mode);
});
