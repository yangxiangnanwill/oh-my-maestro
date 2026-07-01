// Stub: @superset/ui/ai-elements/shimmer-label
import type { ReactNode } from "react";

export interface ShimmerLabelProps {
	children?: ReactNode;
	className?: string;
}

export function ShimmerLabel({ children, className }: ShimmerLabelProps) {
	return <span className={className}>{children}</span>;
}
