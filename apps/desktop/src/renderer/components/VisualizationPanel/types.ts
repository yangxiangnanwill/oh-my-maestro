import type { Artifact } from "../../../lib/workflow-state";

export interface VisualizationPanelProps {
	/** 工作目录路径，用于 tRPC query */
	cwd: string;
	/** Workspace ID，优先由 main process 解析为受信任 cwd */
	workspaceId?: string;
	/** 面板标题，默认 "可视化" */
	title?: string;
}

export type VisualizationTab = "timeline" | "dag" | "cards" | "table";

export type SortField = Extract<
	keyof Artifact,
	"id" | "type" | "status" | "milestone" | "phase" | "path"
>;

export type SortDirection = "asc" | "desc";
