export type ToolState =
	| "pending"
	| "in-progress"
	| "complete"
	| "error"
	| "input-streaming"
	| "input-available"
	| "output-available"
	| "output-error";

export interface BashToolProps {
	command: string;
	stdout?: string;
	stderr?: string;
	exitCode?: number;
	state?: ToolState;
}

export function BashTool({
	command,
	stdout,
	stderr,
	exitCode,
	state,
}: BashToolProps) {
	return null;
}
