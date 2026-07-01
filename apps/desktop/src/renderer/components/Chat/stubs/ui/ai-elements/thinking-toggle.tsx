export type ThinkingLevel = "low" | "medium" | "high";

export interface ThinkingToggleProps {
	level: ThinkingLevel;
	onLevelChange: (level: ThinkingLevel) => void;
	className?: string;
}

export function ThinkingToggle({
	level,
	onLevelChange,
	className,
}: ThinkingToggleProps) {
	return null;
}
