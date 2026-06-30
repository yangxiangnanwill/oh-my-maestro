import { Loader2 } from "lucide-react";
import { useTranslation } from "renderer/contexts/TranslationContext";
import { useWorkflowState } from "renderer/hooks/useWorkflowState";
import type { Artifact, ArtifactType, ProjectState } from "../../../lib/workflow-state";
import type { ArtifactTimelineWidgetProps } from "./types";

// ---------------------------------------------------------------------------
// 制品类型 → 颜色映射
// ---------------------------------------------------------------------------

const typeDotColor: Record<ArtifactType, string> = {
  analyze: "bg-blue-500",
  plan: "bg-purple-500",
  execute: "bg-green-500",
  review: "bg-orange-500",
  test: "bg-yellow-500",
  debug: "bg-red-500",
  brainstorm: "bg-gray-400",
  grill: "bg-gray-400",
  blueprint: "bg-gray-400",
  roadmap: "bg-gray-400",
  verify: "bg-gray-400",
};

const typeLabelColor: Record<string, string> = {
  analyze:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  plan:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  execute:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  review:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  test:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  debug: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
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
// 时间格式化
// ---------------------------------------------------------------------------

function formatDateTime(raw: string | undefined): string {
  if (!raw) return "--";
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${h}:${min}`;
  } catch {
    return raw;
  }
}

// ---------------------------------------------------------------------------
// 时间线条目
// ---------------------------------------------------------------------------

function TimelineItem({
  artifact,
  isLast,
}: {
  artifact: Artifact;
  isLast: boolean;
}) {
  const dotColor =
    typeDotColor[artifact.type as ArtifactType] ?? "bg-gray-400";
  const labelColor =
    typeLabelColor[artifact.type] ??
    "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";

  return (
    <div className="flex gap-3">
      {/* 左侧：圆点 + 竖线 */}
      <div className="flex flex-col items-center">
        <div className={`h-3 w-3 rounded-full ${dotColor}`} />
        {!isLast && <div className="w-px flex-1 bg-border" />}
      </div>

      {/* 右侧：内容 */}
      <div className={`pb-4 ${isLast ? "" : ""}`}>
        <div className="flex items-center gap-2">
          <span
            className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${labelColor}`}
          >
            {artifact.type}
          </span>
          <span className="truncate text-xs font-medium">{artifact.id}</span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatDateTime(artifact.created_at)}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 时间线主体
// ---------------------------------------------------------------------------

function ArtifactTimeline({ artifacts }: { artifacts: Artifact[] }) {
  // 按 created_at 降序排列，取最近 5 条
  const sorted = [...artifacts]
    .filter((a) => a.created_at)
    .sort(
      (a, b) =>
        new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime(),
    )
    .slice(0, 5);

  if (sorted.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="px-4 py-3">
      {sorted.map((artifact, idx) => (
        <TimelineItem
          key={artifact.id}
          artifact={artifact}
          isLast={idx === sorted.length - 1}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 主组件
// ---------------------------------------------------------------------------

export function ArtifactTimelineWidget({
  cwd,
}: ArtifactTimelineWidgetProps) {
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
        <ArtifactTimeline
          artifacts={state.project.artifacts ?? []}
        />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
