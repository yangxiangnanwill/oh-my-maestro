// Stub: @superset/ui/ai-elements/file-diff-tool
import type { ReactNode } from "react";

export type ToolState =
	| "pending"
	| "in-progress"
	| "complete"
	| "error"
	| "input-streaming"
	| "input-available"
	| "output-available"
	| "output-error";

export interface FileDiffToolProps {
	filePath: string;
	oldString?: string;
	newString?: string;
	content?: string;
	isWriteMode?: boolean;
	structuredPatch?: Array<{ lines: string[] }>;
	onFilePathClick?: (filePath?: string) => void;
	renderExpandedContent?: () => ReactNode;
	state?: ToolState;
}

export function FileDiffTool(_props: FileDiffToolProps) {
	return null;
}
