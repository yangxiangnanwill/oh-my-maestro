// Stub: @superset/ui/hover-card
import type { ReactNode } from "react";

export function HoverCard({
	children,
	openDelay,
	closeDelay,
	open,
	onOpenChange,
}: {
	children: ReactNode;
	openDelay?: number;
	closeDelay?: number;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}) {
	return <>{children}</>;
}

export function HoverCardTrigger({
	children,
	asChild,
}: {
	children: ReactNode;
	asChild?: boolean;
}) {
	return <>{children}</>;
}

export function HoverCardContent({
	children,
	className,
	align,
	side,
	sideOffset,
	alignOffset,
}: {
	children: ReactNode;
	className?: string;
	align?: "start" | "center" | "end";
	side?: "top" | "bottom" | "left" | "right";
	sideOffset?: number;
	alignOffset?: number;
}) {
	return <div className={className}>{children}</div>;
}
