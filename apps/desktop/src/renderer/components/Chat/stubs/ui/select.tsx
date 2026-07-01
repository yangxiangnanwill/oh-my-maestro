// Stub: @superset/ui/select
import type { ReactNode } from "react";

export interface SelectProps {
	value?: string;
	onValueChange?: (value: string) => void;
	disabled?: boolean;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	children?: ReactNode;
}

export function Select({ children }: SelectProps) {
	return <>{children}</>;
}

export function SelectTrigger({
	children,
	className,
	asChild,
}: {
	children: ReactNode;
	className?: string;
	asChild?: boolean;
}) {
	return <div className={className}>{children}</div>;
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
	return <span>{placeholder}</span>;
}

export function SelectContent({
	children,
	className,
	side,
	sideOffset,
	align,
	alignOffset,
	position,
}: {
	children: ReactNode;
	className?: string;
	side?: "top" | "bottom" | "left" | "right";
	sideOffset?: number;
	align?: "start" | "center" | "end";
	alignOffset?: number;
	position?: "popper" | "item-aligned";
}) {
	return <div className={className}>{children}</div>;
}

export function SelectItem({
	children,
	value,
	className,
	disabled,
}: {
	children: ReactNode;
	value: string;
	className?: string;
	disabled?: boolean;
}) {
	return <div className={className}>{children}</div>;
}

export function SelectSeparator() {
	return <hr />;
}
