import { Loader2 } from "lucide-react";
import { useTranslation } from "renderer/contexts/TranslationContext";
import { useWorkflowState } from "renderer/hooks/useWorkflowState";
import type { Milestone, ProjectState } from "../../../lib/workflow-state";
import type { MilestoneProgressWidgetProps } from "./types";

// ---------------------------------------------------------------------------
// 状态徽章映射
// ---------------------------------------------------------------------------

const badgeConfig: Record<string, { label: string; className: string }> = {
	active: {
		label: "进行中",
		className:
			"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	},
	completed: {
		label: "已完成",
		className:
			"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
	},
	archived: {
		label: "已归档",
		className:
			"bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
	},
};

// ---------------------------------------------------------------------------
// 进度条颜色
// ---------------------------------------------------------------------------

const _barColorMap: Record<string, string> = {
	completed: "bg-green-500",
	active: "bg-blue-500",
	archived: "bg-gray-400",
};

// ---------------------------------------------------------------------------
// 状态组件
// ---------------------------------------------------------------------------

function LoadingState() {
	const { t } = useTranslation();
	return (
		<div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
			<Loader2 className="h-4 w-4 animate-spin" />
			<span>{t("ui.common.loading")}</span>
		</div>
	);
}

function EmptyState() {
	const { t } = useTranslation();
	return (
		<div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground">
			<p>{t("ui.panel.noMilestones")}</p>
		</div>
	);
}

function ErrorState({ message }: { message: string }) {
	const { t } = useTranslation();
	return (
		<div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm">
			<p className="text-muted-foreground">{t("ui.panel.fetchStateFailed")}</p>
			<p className="max-w-[240px] text-xs text-red-500">{message}</p>
		</div>
	);
}

// ---------------------------------------------------------------------------
// 进度条
// ---------------------------------------------------------------------------

function ProgressBar({
	completed,
	total,
}: {
	completed: number;
	total: number;
}) {
	const pct = total > 0 ? (completed / total) * 100 : 0;

	return (
		<div className="w-full">
			<div className="mb-1 flex items-center justify-between text-xs">
				<span className="font-medium">
					{completed}/{total} 里程碑已完成
				</span>
				<span className="text-muted-foreground">{Math.round(pct)}%</span>
			</div>
			<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
				<div
					className="h-full rounded-full bg-green-500 transition-all duration-300"
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// 里程碑列表
// ---------------------------------------------------------------------------

function MilestoneBadgeList({ milestones }: { milestones: Milestone[] }) {
	return (
		<div className="space-y-1.5">
			{milestones.map((m) => {
				const config = badgeConfig[m.status] ?? {
					label: m.status,
					className:
						"bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
				};
				return (
					<div
						key={m.id}
						className="flex items-center justify-between rounded-md border bg-card px-3 py-1.5"
					>
						<span className="truncate text-xs font-medium">{m.name}</span>
						<span
							className={`inline-block shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
						>
							{config.label}
						</span>
					</div>
				);
			})}
		</div>
	);
}

// ---------------------------------------------------------------------------
// 数据展示
// ---------------------------------------------------------------------------

function MilestoneData({ project }: { project: ProjectState }) {
	const milestones = project.milestones ?? [];

	if (milestones.length === 0) {
		return <EmptyState />;
	}

	const completedCount = milestones.filter(
		(m) => m.status === "completed",
	).length;

	return (
		<div className="space-y-3 px-4 py-3">
			<ProgressBar completed={completedCount} total={milestones.length} />
			<MilestoneBadgeList milestones={milestones} />
		</div>
	);
}

// ---------------------------------------------------------------------------
// 主组件
// ---------------------------------------------------------------------------

export function MilestoneProgressWidget({ cwd }: MilestoneProgressWidgetProps) {
	const { data: state, isLoading, error } = useWorkflowState(cwd);

	const isProjectState = (
		s: typeof state,
	): s is {
		project: ProjectState;
		commandChain: unknown;
		ralphSession: unknown;
	} => s !== undefined && s !== null && !("uninitialized" in s.project);

	return (
		<div className="flex h-full flex-col">
			{isLoading && !state ? (
				<LoadingState />
			) : error ? (
				<ErrorState
					message={error instanceof Error ? error.message : "Unknown error"}
				/>
			) : !state ? (
				<EmptyState />
			) : "uninitialized" in state.project ? (
				<EmptyState />
			) : isProjectState(state) ? (
				<MilestoneData project={state.project} />
			) : (
				<EmptyState />
			)}
		</div>
	);
}
