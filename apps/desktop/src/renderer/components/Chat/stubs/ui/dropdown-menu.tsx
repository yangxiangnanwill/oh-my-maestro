// Stub: @superset/ui/dropdown-menu
import type { ReactNode } from "react";

export interface DropdownMenuProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	defaultOpen?: boolean;
	modal?: boolean;
	children?: ReactNode;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
	return <>{children}</>;
}

export function DropdownMenuTrigger({
	children,
	asChild,
}: {
	children: ReactNode;
	asChild?: boolean;
}) {
	return <>{children}</>;
}

export function DropdownMenuContent({
	children,
	className,
	align,
	side,
	sideOffset,
	alignOffset,
	onPointerDownOutside,
	onFocusOutside,
	onWheel,
	forceMount,
}: {
	children: ReactNode;
	className?: string;
	align?: "start" | "center" | "end";
	side?: "top" | "bottom" | "left" | "right";
	sideOffset?: number;
	alignOffset?: number;
	onPointerDownOutside?: () => void;
	onFocusOutside?: (e: any) => void;
	onWheel?: (e: any) => void;
	forceMount?: boolean;
}) {
	return <div className={className}>{children}</div>;
}

export function DropdownMenuItem({
	children,
	onSelect,
	className,
	disabled,
	onClick,
}: {
	children: ReactNode;
	onSelect?: (event: Event) => void;
	className?: string;
	disabled?: boolean;
	onClick?: () => void;
}) {
	return <div className={className}>{children}</div>;
}

export function DropdownMenuCheckboxItem({
	children,
	checked,
	onCheckedChange,
	className,
}: {
	children: ReactNode;
	checked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
	className?: string;
}) {
	return <div className={className}>{children}</div>;
}

export function DropdownMenuRadioGroup({
	children,
	value,
	onValueChange,
}: {
	children: ReactNode;
	value?: string;
	onValueChange?: (value: string) => void;
}) {
	return <>{children}</>;
}

export function DropdownMenuRadioItem({
	children,
	value,
	className,
}: {
	children: ReactNode;
	value: string;
	className?: string;
}) {
	return <div className={className}>{children}</div>;
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
	return <hr className={className} />;
}

export function DropdownMenuShortcut({ children }: { children: ReactNode }) {
	return <span>{children}</span>;
}

export function DropdownMenuLabel({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return <div className={className}>{children}</div>;
}

export function DropdownMenuSub({
	children,
	open,
	onOpenChange,
}: {
	children: ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}) {
	return <>{children}</>;
}

export function DropdownMenuSubTrigger({
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

export function DropdownMenuSubContent({
	children,
	className,
	sideOffset,
	alignOffset,
}: {
	children: ReactNode;
	className?: string;
	sideOffset?: number;
	alignOffset?: number;
}) {
	return <div className={className}>{children}</div>;
}
