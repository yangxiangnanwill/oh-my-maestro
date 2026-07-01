export type ToolState =
	| "pending"
	| "in-progress"
	| "complete"
	| "error"
	| "input-streaming"
	| "input-available"
	| "output-available"
	| "output-error";

export interface ReadFileToolProps {
	filePath: string;
	content?: string;
	state?: ToolState;
	onFilePathClick?: (filePath?: string) => void;
	filename?: string;
	lineRange?: string;
	language?: string;
	isError?: boolean;
	isPending?: boolean;
	onOpenInPane?: () => void;
}

export function ReadFileTool({
	filePath,
	content,
	state,
	onFilePathClick,
}: ReadFileToolProps) {
	return null;
}
