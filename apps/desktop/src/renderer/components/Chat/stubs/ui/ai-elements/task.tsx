// Stub: @superset/ui/ai-elements/task
import type { ReactNode } from "react";

export interface TaskItemProps {
	children?: ReactNode;
	title?: string;
	status?: string;
	description?: string;
	className?: string;
}

export function TaskItem({
	children,
	title,
	status,
	description,
	className,
}: TaskItemProps) {
	return <div className={className}>{children}</div>;
}

export interface TaskItemFileProps {
	filePath: string;
	onClick?: () => void;
}

export function TaskItemFile({ filePath, onClick }: TaskItemFileProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="text-xs font-mono text-primary hover:underline"
		>
			{filePath}
		</button>
	);
}
