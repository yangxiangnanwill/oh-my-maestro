// Stub: @superset/ui/ai-elements/plan
import type { ReactNode } from "react";

export interface PlanProps {
	children?: ReactNode;
	title?: string;
	description?: string;
	defaultOpen?: boolean;
}

export function Plan({ children, title, description, defaultOpen }: PlanProps) {
	return <div>{children}</div>;
}

export function PlanHeader({
	children,
	className,
}: {
	children?: ReactNode;
	className?: string;
}) {
	return <div className={className}>{children}</div>;
}

export function PlanTitle({
	children,
	className,
}: {
	children?: ReactNode;
	className?: string;
}) {
	return <h3 className={className}>{children}</h3>;
}

export function PlanDescription({
	children,
	className,
}: {
	children?: ReactNode;
	className?: string;
}) {
	return <p className={className}>{children}</p>;
}

export function PlanContent({
	children,
	className,
}: {
	children?: ReactNode;
	className?: string;
}) {
	return <div className={className}>{children}</div>;
}

export function PlanStep({
	children,
	title,
	status,
}: {
	children?: ReactNode;
	title?: string;
	status?: "pending" | "in-progress" | "complete";
}) {
	return <div>{children}</div>;
}
