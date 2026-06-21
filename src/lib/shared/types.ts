// Maestro IDE — Shared Types

/** Display mode for concept translation */
export type DisplayMode = 'simple' | 'advanced';

/** Workflow execution status */
export type WorkflowStatus = 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

/** Approval gate status */
export type GateStatus = 'pending' | 'presented' | 'approved' | 'rejected' | 'expired';

/** Terminal session status */
export type TerminalStatus = 'spawning' | 'running' | 'exited' | 'crashed';

/** Step status within a workflow execution */
export type StepStatus = 'pending' | 'running' | 'complete' | 'failed' | 'skipped';

/** Core entity: WorkflowExecution */
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  params: Record<string, unknown>;
  status: WorkflowStatus;
  steps: ExecutionStep[];
  startedAt: string | null;
  completedAt: string | null;
}

export interface ExecutionStep {
  index: number;
  name: string;
  translatedName?: string;
  status: StepStatus;
  output?: string;
  startedAt: string | null;
  completedAt: string | null;
}

/** Core entity: ProjectState */
export interface ProjectState {
  projectId: string;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  name: string;
  translatedName?: string;
  status: string;
  phases: Phase[];
}

export interface Phase {
  id: string;
  name: string;
  translatedName?: string;
  status: string;
  steps: PhaseStep[];
}

export interface PhaseStep {
  id: string;
  name: string;
  translatedName?: string;
  status: StepStatus;
}

/** Core entity: DialogSession */
export interface DialogSession {
  sessionId: string;
  cliProcessId: number | null;
  createdAt: string;
  lastActivityAt: string;
  status: 'active' | 'closed' | 'error';
}

/** Core entity: TerminalSession */
export interface TerminalSession {
  terminalId: string;
  ptyPid: number | null;
  cwd: string;
  cols: number;
  rows: number;
  status: TerminalStatus;
}

/** Core entity: ApprovalGate */
export interface ApprovalGate {
  gateId: string;
  executionId: string;
  stepIndex: number;
  status: GateStatus;
  diff?: string;
  dryRunResult?: string;
  createdAt: string;
  resolvedAt: string | null;
}

/** WebSocket message envelope */
export interface WSMessage<T = unknown> {
  channel: string;
  type: string;
  payload: T;
  timestamp: string;
}

/** Recommendation from Project Radar */
export interface Recommendation {
  id: string;
  type: 'workflow' | 'action' | 'info';
  title: string;
  translatedTitle?: string;
  description: string;
  workflowId?: string;
  params?: Record<string, unknown>;
}

/** Parameter definition for workflow metadata */
export interface ParamDef {
  name: string;
  type: string;
  required: boolean;
  default?: unknown;
}

/** Workflow metadata from CLI skills output */
export interface WorkflowMeta {
  id: string;
  name: string;
  category: string;
  description: string;
  params: ParamDef[];
}

/** Delegate execution event from CLI broker output */
export interface DelegateEvent {
  type: 'queued' | 'started' | 'completed' | 'failed';
  executionId: string;
  stepIndex?: number;
  stepName?: string;
  output?: string;
  timestamp: string;
}

/** Event source for state sync */
export type EventSource = 'in-process' | 'filesystem';

/** State sync event with source tracking */
export interface StateSyncEvent {
  id: string;
  source: EventSource;
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
  executionId?: string;
}

/** Stream chunk from Claude Code CLI NDJSON output */
export interface StreamChunk {
  type: 'text' | 'tool_use' | 'tool_result' | 'error';
  content: string;
  timestamp: string;
}

/** Intent routing result from keyword matching */
export interface IntentCandidate {
  workflowId: string;
  score: number;
}

export interface IntentResult {
  workflowId: string | null;
  confidence: number;
  candidates: IntentCandidate[];
}
