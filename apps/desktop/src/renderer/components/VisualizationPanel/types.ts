export interface VisualizationPanelProps {
  /** 工作目录路径，用于 tRPC query */
  cwd: string;
  /** 面板标题，默认 "可视化" */
  title?: string;
}

export type VisualizationTab = "timeline" | "dag" | "cards" | "table";

export type SortField = "id" | "type" | "status" | "milestone" | "phase" | "path";

export type SortDirection = "asc" | "desc";
