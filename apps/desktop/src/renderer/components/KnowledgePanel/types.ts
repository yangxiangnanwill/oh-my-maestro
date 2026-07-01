/** 知识图谱搜索结果输入 */
export interface KnowledgeSearchInput {
	query: string;
	cwd: string;
	maxResults?: number;
}

/** 知识实体类型 */
export type KnowledgeEntityType =
	| "command"
	| "skill"
	| "spec"
	| "knowhow"
	| "issue";

/** 知识图谱实体 */
export interface KnowledgeEntity {
	id: string;
	name: string;
	type: KnowledgeEntityType;
	relevanceScore: number;
	matchedKeywords: string[];
	relatedNodes: string[];
}

/** 知识图谱搜索结果 */
export interface KnowledgeSearchResult {
	entities: KnowledgeEntity[];
	totalCount: number;
	searchTimeMs: number;
}

/** KnowledgePanel 组件 props */
export interface KnowledgePanelProps {
	/** 工作目录路径，用于 tRPC query */
	cwd: string;
	/** Workspace ID，优先由 main process 解析为受信任 cwd */
	workspaceId?: string;
	/** 搜索输入框占位文本，默认 "搜索知识图谱..." */
	placeholder?: string;
}
