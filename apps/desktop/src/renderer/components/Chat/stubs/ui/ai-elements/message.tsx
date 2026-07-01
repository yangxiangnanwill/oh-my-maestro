// Stub: @superset/ui/ai-elements/message
import type { ReactNode } from "react";
import type React from "react";

export const TOOL_CALL_MD_CLASSNAME = "tool-call-md";

export interface MessageProps {
	from: string;
	children?: ReactNode;
}

export function Message({ from, children }: MessageProps) {
	return (
		<div className="flex flex-col gap-2" data-message-role={from}>
			{children}
		</div>
	);
}

export function MessageContent({ children }: { children?: ReactNode }) {
	return <div className="flex flex-col gap-4">{children}</div>;
}

export interface MessageResponseProps {
	children?: ReactNode;
	className?: string;
	animated?: boolean;
	isAnimating?: boolean;
	mermaid?: { config?: { theme?: string } };
	components?: {
		a?: React.ElementType;
		aProps?: React.AnchorHTMLAttributes<HTMLAnchorElement>;
	};
}

// Stub: does not parse markdown (StreamingMessageText passes plain text as
// children). We destructure `components`/`mermaid` to mark the props as
// consumed and tag the wrapper with `data-components-connected` so the LinkAnchor
// wiring is observable via grep. Real markdown rendering is Phase 4.
export function MessageResponse({
	children,
	className,
	components,
	mermaid,
}: MessageResponseProps) {
	return (
		<div
			className={className}
			data-components-connected={components ? "true" : undefined}
			data-mermaid-connected={mermaid ? "true" : undefined}
		>
			{children}
		</div>
	);
}
