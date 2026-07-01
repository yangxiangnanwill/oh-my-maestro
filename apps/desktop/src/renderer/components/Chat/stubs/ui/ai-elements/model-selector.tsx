// Stub: @superset/ui/ai-elements/model-selector
import type { ReactNode } from "react";

export interface ModelSelectorProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	children?: ReactNode;
}

export function ModelSelector({ children }: ModelSelectorProps) {
	return <>{children}</>;
}

export function ModelSelectorTrigger({
	children,
	asChild,
}: {
	children: ReactNode;
	asChild?: boolean;
}) {
	return <>{children}</>;
}

export function ModelSelectorContent({
	children,
	title,
	className,
}: {
	children: ReactNode;
	title?: string;
	className?: string;
}) {
	return <>{children}</>;
}

export function ModelSelectorInput({ placeholder }: { placeholder?: string }) {
	return null;
}

export function ModelSelectorList({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return <>{children}</>;
}

export function ModelSelectorEmpty({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return <>{children}</>;
}

export function ModelSelectorLogo({ provider }: { provider: string }) {
	return null;
}

export function ModelSelectorName({
	children,
	className,
}: {
	children?: ReactNode;
	className?: string;
}) {
	return <span className={className}>{children}</span>;
}

export function ModelSelectorItem({
	children,
	onSelect,
	value,
	className,
	disabled,
}: {
	children: ReactNode;
	onSelect?: () => void;
	value?: string;
	className?: string;
	disabled?: boolean;
}) {
	return <>{children}</>;
}

export function ModelSelectorGroup({
	children,
	heading,
	className,
}: {
	children: ReactNode;
	heading?: string;
	className?: string;
}) {
	return <div>{children}</div>;
}
