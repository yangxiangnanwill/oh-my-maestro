/** 步骤状态枚举 */
export type StepStatus = "pending" | "running" | "completed" | "failed" | "skipped";

/** 单个步骤 */
export interface Step {
  id: string;
  label: string;
  status: StepStatus;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

/** 决策节点 */
export interface DecisionNode {
  id: string;
  label: string;
  question: string;
  options: string[];
  selectedOption?: string;
  resolved: boolean;
}

/** status.json 完整结构 */
export interface CommandChainStatus {
  steps: Step[];
  decisionNodes: DecisionNode[];
  completionConfirmed: boolean;
}

/** CommandChainPanel 组件 props */
export interface CommandChainPanelProps {
  /** 工作目录路径，用于 tRPC query */
  cwd: string;
  /** 面板标题，默认 "命令链状态" */
  title?: string;
}
