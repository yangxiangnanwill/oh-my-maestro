import {
	cloneElement,
	isValidElement,
	type ReactElement,
	type ReactNode,
	useCallback,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";

// ---------------------------------------------------------------------------
// Minimal Tooltip implementation that mirrors the shadcn/ui Tooltip API.
// Replace with @radix-ui/react-tooltip when that dependency is added.
// ---------------------------------------------------------------------------

interface TooltipContextValue {
	open: boolean;
	setOpen: (open: boolean) => void;
	triggerRef: React.RefObject<HTMLElement | null>;
}

// Module-level context holder — one active tooltip at a time is sufficient
// for the clickPolicy use cases (hover hints on individual rows).
let activeContext: TooltipContextValue | null = null;

function useTooltipContext(): TooltipContextValue {
	// biome-ignore lint/correctness/useJsxKeyInIterable: not in a loop
	return (
		activeContext ?? {
			open: false,
			setOpen: () => {},
			triggerRef: { current: null },
		}
	);
}

interface TooltipProps {
	children: ReactNode;
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export function Tooltip({
	children,
	open: controlledOpen,
	defaultOpen = false,
	onOpenChange,
}: TooltipProps) {
	const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
	const triggerRef = useRef<HTMLElement | null>(null);

	const isControlled = controlledOpen !== undefined;
	const open = isControlled ? controlledOpen : uncontrolledOpen;

	const setOpen = useCallback(
		(next: boolean) => {
			if (!isControlled) setUncontrolledOpen(next);
			onOpenChange?.(next);
		},
		[isControlled, onOpenChange],
	);

	activeContext = { open, setOpen, triggerRef };

	return <>{children}</>;
}

interface TooltipTriggerProps {
	asChild?: boolean;
	children: ReactNode;
}

export function TooltipTrigger({ children, asChild }: TooltipTriggerProps) {
	const ctx = useTooltipContext();

	const handlers = {
		onMouseEnter: () => ctx.setOpen(true),
		onMouseLeave: () => ctx.setOpen(false),
		onFocus: () => ctx.setOpen(true),
		onBlur: () => ctx.setOpen(false),
	};

	if (asChild && isValidElement(children)) {
		const child = children as ReactElement<Record<string, unknown>>;
		return cloneElement(child, {
			ref: ctx.triggerRef,
			...handlers,
		} as Record<string, unknown>);
	}

	return (
		<span
			ref={(el) => {
				ctx.triggerRef.current = el;
			}}
			{...handlers}
		>
			{children}
		</span>
	);
}

interface TooltipContentProps {
	children: ReactNode;
	side?: "top" | "right" | "bottom" | "left";
	showArrow?: boolean;
}

export function TooltipContent({
	children,
	side = "bottom",
}: TooltipContentProps) {
	const ctx = useTooltipContext();

	if (!ctx.open) return null;

	const triggerEl = ctx.triggerRef.current;
	const rect = triggerEl?.getBoundingClientRect();

	const style: React.CSSProperties = rect
		? {
				position: "fixed",
				left: side === "right" ? rect.right + 8 : rect.left,
				top:
					side === "bottom"
						? rect.bottom + 4
						: side === "top"
							? rect.top - 4
							: rect.top,
				transform: side === "top" ? "translateY(-100%)" : undefined,
				zIndex: 50,
			}
		: { position: "fixed", zIndex: 50 };

	return createPortal(
		<div
			role="tooltip"
			className="pointer-events-none fixed z-50 w-fit rounded-md bg-foreground px-3 py-1.5 text-xs text-background"
			style={style}
		>
			{children}
		</div>,
		document.body,
	);
}
