// Maestro IDE — Event Channel & Type Constants

/** WebSocket channel names */
export const Channels = {
  WORKFLOW: 'workflow',
  PROJECT: 'project',
  DIALOG: 'dialog',
  TERMINAL: 'terminal',
  GATE: 'gate',
  STATE: 'state',
} as const;

/** Workflow event types */
export const WorkflowEvents = {
  STEP_UPDATE: 'workflow:step-update',
  EXECUTION_STARTED: 'workflow:execution-started',
  EXECUTION_COMPLETED: 'workflow:execution-completed',
  EXECUTION_FAILED: 'workflow:execution-failed',
  EXECUTION_CANCELLED: 'workflow:execution-cancelled',
} as const;

/** Project state event types */
export const ProjectEvents = {
  STATE_UPDATE: 'project:state-update',
  MILESTONE_CHANGED: 'project:milestone-changed',
  PHASE_CHANGED: 'project:phase-changed',
} as const;

/** Dialog event types */
export const DialogEvents = {
  SESSION_CREATED: 'dialog:session-created',
  STREAM_CHUNK: 'dialog:stream-chunk',
  INTENT_ROUTED: 'dialog:intent-routed',
  SESSION_CLOSED: 'dialog:session-closed',
} as const;

/** Terminal event types */
export const TerminalEvents = {
  OUTPUT: 'term:output',
  INPUT: 'term:input',
  RESIZE: 'term:resize',
  EXIT: 'term:exit',
  CREATED: 'term:created',
  CREATE: 'term:create',
  DESTROY: 'term:destroy',
} as const;

/** Gate event types */
export const GateEvents = {
  PENDING: 'gate:pending',
  RESOLVED: 'gate:resolved',
  APPROVED: 'gate:approved',
  REJECTED: 'gate:rejected',
} as const;

/** State sync event types */
export const StateSyncEvents = {
  SYNC: 'state:sync',
  RECONNECT: 'state:reconnect',
  SNAPSHOT: 'state:snapshot',
} as const;

/** All event types union */
export type EventType =
  | (typeof WorkflowEvents)[keyof typeof WorkflowEvents]
  | (typeof ProjectEvents)[keyof typeof ProjectEvents]
  | (typeof DialogEvents)[keyof typeof DialogEvents]
  | (typeof TerminalEvents)[keyof typeof TerminalEvents]
  | (typeof GateEvents)[keyof typeof GateEvents]
  | (typeof StateSyncEvents)[keyof typeof StateSyncEvents];
