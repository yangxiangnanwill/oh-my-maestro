/**
 * CommandChainPanel 类型 — 从共享 workflow-state 模块重导出。
 *
 * 单一真相源在 src/lib/workflow-state/types.ts，
 * 此文件保持向后兼容的导出名称。
 */
export type {
	StepStatus,
	CommandChainStep as Step,
	CommandChainDecisionNode as DecisionNode,
	CommandChainStatus,
} from "../../../lib/workflow-state";

/** CommandChainPanel 组件 props */
export interface CommandChainPanelProps {
	/** 工作目录路径，用于 tRPC query */
	cwd: string;
	/** 面板标题，默认 "命令链状态" */
	title?: string;
}
