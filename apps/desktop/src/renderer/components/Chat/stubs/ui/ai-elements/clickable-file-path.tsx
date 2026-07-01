// Stub: @superset/ui/ai-elements/clickable-file-path
import type { ReactNode } from "react";

export interface ClickableFilePathProps {
	filePath: string;
	onClick?: () => void;
	children?: ReactNode;
	path?: string;
	display?: string;
	onOpen?: () => void;
}

export function ClickableFilePath({
	filePath,
	onClick,
	children,
	path,
	display,
	onOpen,
}: ClickableFilePathProps) {
	return (
		<button
			type="button"
			onClick={onClick ?? onOpen}
			className="text-xs font-mono text-primary hover:underline"
		>
			{children ?? display ?? path ?? filePath}
		</button>
	);
}
