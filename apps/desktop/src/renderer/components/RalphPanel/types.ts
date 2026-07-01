export interface RalphPanelProps {
	/** 工作目录路径，用于 tRPC query */
	cwd: string;
	/** Workspace ID，优先由 main process 解析为受信任 cwd */
	workspaceId?: string;
	/** 面板标题，默认 "Ralph 会话" */
	title?: string;
}
