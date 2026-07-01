// Stub: @superset/ui/input-group
import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "./utils";

export type InputGroupProps = React.HTMLAttributes<HTMLDivElement>;

export function InputGroup({ className, ...props }: InputGroupProps) {
	return (
		<div className={cn("flex items-center gap-2", className)} {...props} />
	);
}

export type InputGroupInputProps = InputHTMLAttributes<HTMLInputElement>;

export const InputGroupInput = forwardRef<
	HTMLInputElement,
	InputGroupInputProps
>(({ className, ...props }, ref) => {
	return (
		<input
			className={cn(
				"flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
});
InputGroupInput.displayName = "InputGroupInput";
