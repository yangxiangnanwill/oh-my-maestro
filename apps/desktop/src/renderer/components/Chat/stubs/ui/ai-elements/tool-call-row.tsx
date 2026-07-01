// Stub: @superset/ui/ai-elements/tool-call-row
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

export interface ToolCallRowProps {
	children?: ReactNode;
	icon?: React.ComponentType<{ className?: string }>;
	label?: string;
	state?: ToolState;
	defaultOpen?: boolean;
	isPending?: boolean;
	isError?: boolean;
	isNotConfigured?: boolean;
	description?: string | ReactNode;
	title?: string | ReactNode;
}

export function ToolCallRow({
	children,
	icon: Icon,
	label,
	state,
	defaultOpen,
	isPending,
	isError,
	description,
	title,
}: ToolCallRowProps) {
	return (
		<div className="rounded-lg border">
			<div className="flex items-center gap-2 px-3 py-2 text-xs font-medium">
				{Icon && <Icon className="size-3.5" />}
				<span>{label ?? title}</span>
			</div>
			{children && <div className="px-3 pb-2">{children}</div>}
		</div>
	);
}
