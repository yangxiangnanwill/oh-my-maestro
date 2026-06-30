import { Loader2 } from "lucide-react";
import { useTranslation } from "renderer/contexts/TranslationContext";
import { useWorkflowState } from "renderer/hooks/useWorkflowState";
import type { ArtifactType, ProjectState } from "../../../lib/workflow-state";
import type { CommandStatsWidgetProps } from "./types";

// ---------------------------------------------------------------------------
// 统计卡片配置
// ---------------------------------------------------------------------------

interface StatCardConfig {
  type: ArtifactType;
  label: string;
  color: string;
}

const statCards: StatCardConfig[] = [
  { type: "analyze", label: "分析", color: "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" },
  { type: "plan", label: "规划", color: "border-purple-400 bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300" },
  { type: "execute", label: "执行", color: "border-green-400 bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300" },
  { type: "review", label: "评审", color: "border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300" },
  { type: "test", label: "测试", color: "border-yellow-400 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300" },
  { type: "debug", label: "调试", color: "border-red-400 bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300" },
];

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
      <p>{t("ui.panel.noArtifacts")}</p>
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
// 统计数据展示
// ---------------------------------------------------------------------------

function StatCards({ artifacts }: { artifacts: { type: string }[] }) {
  const { t } = useTranslation();

  // 按类型统计
  const counts: Record<string, number> = {};
  for (const a of artifacts) {
    counts[a.type] = (counts[a.type] ?? 0) + 1;
  }

  // 判断是否所有统计都为 0
  const hasData = Object.values(counts).some((c) => c > 0);
  if (!hasData) {
    // 空统计当作空状态处理（但 artifacts 数组非空，所以用 t 文本）
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground">
        <p>{t("ui.panel.noArtifacts")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3">
      {statCards.map((card) => {
        const count = counts[card.type] ?? 0;
        return (
          <div
            key={card.type}
            className={`flex-1 min-w-[80px] rounded-lg border px-3 py-2.5 text-center ${card.color}`}
          >
            <div className="text-xs opacity-80">{card.label}</div>
            <div className="mt-1 text-xl font-bold">{count}</div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 主组件
// ---------------------------------------------------------------------------

export function CommandStatsWidget({
  cwd,
}: CommandStatsWidgetProps) {
  const { data: state, isLoading, error } = useWorkflowState(cwd);

  const isProjectState = (
    s: typeof state,
  ): s is { project: ProjectState; commandChain: unknown; ralphSession: unknown } =>
    s !== undefined &&
    s !== null &&
    !("uninitialized" in s.project);

  return (
    <div className="flex h-full flex-col">
      {isLoading && !state ? (
        <LoadingState />
      ) : error ? (
        <ErrorState
          message={
            error instanceof Error ? error.message : "Unknown error"
          }
        />
      ) : !state ? (
        <EmptyState />
      ) : "uninitialized" in state.project ? (
        <EmptyState />
      ) : isProjectState(state) ? (
        <StatCards artifacts={state.project.artifacts ?? []} />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
