// Stub: @superset/ui/collapsible
import type { ReactNode } from "react";

export function Collapsible({
	children,
	open,
	onOpenChange,
	className,
}: {
	children: ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	className?: string;
}) {
	return <>{children}</>;
}

export function CollapsibleTrigger({
	children,
	asChild,
	className,
}: {
	children: ReactNode;
	asChild?: boolean;
	className?: string;
}) {
	return <>{children}</>;
}

export function CollapsibleContent({
	children,
	className,
	forceMount,
}: {
	children: ReactNode;
	className?: string;
	forceMount?: boolean;
}) {
	return <>{children}</>;
}
