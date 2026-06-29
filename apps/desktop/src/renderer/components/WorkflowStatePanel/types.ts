export interface WorkflowStatePanelProps {
  /** 工作目录路径，用于 tRPC query */
  cwd: string;
  /** 面板标题，默认 "工作流状态" */
  title?: string;
}
