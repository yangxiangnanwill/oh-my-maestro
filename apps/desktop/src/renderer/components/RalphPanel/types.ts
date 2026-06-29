export interface RalphPanelProps {
  /** 工作目录路径，用于 tRPC query */
  cwd: string;
  /** 面板标题，默认 "Ralph 会话" */
  title?: string;
}
