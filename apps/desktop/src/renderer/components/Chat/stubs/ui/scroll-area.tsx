// Stub: @superset/ui/scroll-area
import type { ReactNode } from "react";

export interface ScrollAreaProps {
	children?: ReactNode;
	className?: string;
}

export function ScrollArea({ children, className }: ScrollAreaProps) {
	return <div className={className}>{children}</div>;
}
