import { Circle, CircleCheck, CircleX, Loader2 } from "lucide-react";
import type { Step, StepStatus } from "./types";

/** 状态 → 图标映射 */
const statusIconMap: Record<StepStatus, React.ReactNode> = {
	pending: <Circle className="h-4 w-4 text-muted-foreground" />,
	running: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
	completed: <CircleCheck className="h-4 w-4 text-green-500" />,
	failed: <CircleX className="h-4 w-4 text-red-500" />,
	skipped: <Circle className="h-4 w-4 text-muted-foreground/50" />,
};

/** 状态 → 中文文本映射 */
const statusLabelMap: Record<StepStatus, string> = {
	pending: "等待中",
	running: "执行中",
	completed: "已完成",
	failed: "失败",
	skipped: "已跳过",
};

/** 格式化耗时（毫秒 → 可读字符串） */
function formatDuration(ms: number): string {
	if (ms < 1000) return `${ms}ms`;
	if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
	const minutes = Math.floor(ms / 60_000);
	const seconds = Math.round((ms % 60_000) / 1000);
	return `${minutes}m ${seconds}s`;
}

/** 计算步骤耗时 */
function computeDuration(step: Step): number | undefined {
	if (step.startedAt && step.completedAt) {
		const start = new Date(step.startedAt).getTime();
		const end = new Date(step.completedAt).getTime();
		if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) {
			return end - start;
		}
	}
	return undefined;
}

interface StepItemProps {
	step: Step;
}

export function StepItem({ step }: StepItemProps) {
	const icon = statusIconMap[step.status] ?? statusIconMap.pending;
	const statusLabel = statusLabelMap[step.status] ?? step.status;
	const duration = computeDuration(step);

	return (
		<li className="flex items-center gap-3 px-3 py-2 text-sm">
			<span className="flex-shrink-0">{icon}</span>
			<span className="flex-1 truncate">{step.label}</span>
			<span className="flex-shrink-0 text-xs text-muted-foreground">
				{statusLabel}
			</span>
			{duration !== undefined && (
				<span className="flex-shrink-0 text-xs text-muted-foreground/70 tabular-nums">
					{formatDuration(duration)}
				</span>
			)}
			{step.error && (
				<span
					className="flex-shrink-0 max-w-[120px] truncate text-xs text-red-500"
					title={step.error}
				>
					{step.error}
				</span>
			)}
		</li>
	);
}
