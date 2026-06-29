import { AlertTriangle, Briefcase, FolderTree, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "renderer/contexts/TranslationContext";
import { useWorkflowState } from "renderer/hooks/useWorkflowState";
import type { Milestone, Artifact, ProjectState } from "../../../lib/workflow-state";
import type { WorkflowStatePanelProps } from "./types";

// ---------------------------------------------------------------------------
// 状态组件
// ---------------------------------------------------------------------------

function NoWorkspaceState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground">
      <Briefcase className="h-8 w-8" />
      <p>{t("ui.panel.noWorkspaceMessage")}</p>
    </div>
  );
}

function LoadingState() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{t("ui.panel.loadingState")}</span>
    </div>
  );
}

function UninitializedState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground">
      <FolderTree className="h-8 w-8" />
      <p>{t("ui.panel.projectUninitialized")}</p>
      <p className="text-xs">{t("ui.panel.initHint")}</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm">
      <AlertTriangle className="h-8 w-8 text-amber-500" />
      <p className="text-muted-foreground">{t("ui.panel.fetchStateFailed")}</p>
      <p className="max-w-[240px] text-xs text-red-500">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 状态徽章
// ---------------------------------------------------------------------------

const milestoneBadgeMap: Record<string, { label: string; className: string }> = {
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
    className: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  },
};

const projectStatusBadgeMap: Record<string, { label: string; className: string }> = {
  active: {
    label: "活跃",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  paused: {
    label: "已暂停",
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  completed: {
    label: "已完成",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
};

const artifactStatusBadgeMap: Record<string, { label: string; className: string }> = {
  completed: {
    label: "完成",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  running: {
    label: "运行中",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  failed: {
    label: "失败",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  pending: {
    label: "待处理",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  },
  gaps_found: {
    label: "发现差距",
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
};

function StatusBadge({
  status,
  map,
}: {
  status: string;
  map: Record<string, { label: string; className: string }>;
}) {
  const badge = map[status] ?? {
    label: status,
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// 里程碑列表（可折叠）
// ---------------------------------------------------------------------------

function MilestoneList({
  milestones,
  currentMilestoneId,
}: {
  milestones: Milestone[];
  currentMilestoneId: string | null | undefined;
}) {
  const [collapsed, setCollapsed] = useState(true);

  const { t } = useTranslation();

  if (!milestones || milestones.length === 0) {
    return (
      <p className="px-4 text-xs text-muted-foreground">{t("ui.panel.noMilestones")}</p>
    );
  }

  return (
    <section className="px-4">
      <button
        type="button"
        className="mb-2 flex w-full items-center justify-between text-xs font-medium text-muted-foreground"
        onClick={() => setCollapsed((prev) => !prev)}
      >
        <span>里程碑 ({milestones.length})</span>
        {collapsed ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5" />
        )}
      </button>
      {!collapsed && (
        <div className="space-y-1.5">
          {milestones.map((m) => {
            const isCurrent = m.id === currentMilestoneId;
            return (
              <div
                key={m.id}
                className={`rounded-md border px-3 py-2 ${
                  isCurrent ? "border-primary/50 bg-primary/5" : "bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{m.name}</span>
                  <div className="flex items-center gap-2">
                    {isCurrent && (
                      <span className="text-xs text-primary">当前</span>
                    )}
                    <StatusBadge status={m.status} map={milestoneBadgeMap} />
                  </div>
                </div>
                {m.created_at && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    创建: {m.created_at}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// 最近制品
// ---------------------------------------------------------------------------

function RecentArtifacts({ artifacts }: { artifacts: Artifact[] }) {
  const { t } = useTranslation();
  const recent = artifacts.slice(-5).reverse();

  return (
    <section className="px-4">
      <h4 className="mb-2 text-xs font-medium text-muted-foreground">
        最近制品 ({recent.length})
      </h4>
      {recent.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("ui.panel.noArtifacts")}</p>
      ) : (
        <div className="space-y-1.5">
          {recent.map((a) => (
            <div
              key={a.id}
              className="rounded-md border bg-card px-3 py-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium truncate max-w-[160px]">
                  {a.id}
                </span>
                <StatusBadge
                  status={a.status ?? ""}
                  map={artifactStatusBadgeMap}
                />
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{a.type}</span>
                {a.milestone && (
                  <>
                    <span className="opacity-30">|</span>
                    <span>{a.milestone}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// 项目数据展示
// ---------------------------------------------------------------------------

function ProjectData({ project }: { project: ProjectState }) {
  const milestones = project.milestones ?? [];
  const artifacts = project.artifacts ?? [];
  const projectInfo = project.project;

  return (
    <div className="space-y-4 py-3">
      {/* 项目名称 + 描述 */}
      <section className="px-4">
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">
              {projectInfo?.name ?? "未命名项目"}
            </h4>
            {project.status && (
              <StatusBadge
                status={project.status}
                map={projectStatusBadgeMap}
              />
            )}
          </div>
          {projectInfo?.description && (
            <p className="mt-2 text-xs text-muted-foreground">
              {projectInfo.description}
            </p>
          )}
          {project.current_milestone && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">当前里程碑:</span>
              <span className="font-medium">{project.current_milestone}</span>
            </div>
          )}
        </div>
      </section>

      {/* 制品总数 */}
      {artifacts.length > 0 && (
        <section className="px-4">
          <p className="text-xs text-muted-foreground">
            共 {artifacts.length} 个制品
          </p>
        </section>
      )}

      {/* 里程碑列表 */}
      <MilestoneList
        milestones={milestones}
        currentMilestoneId={project.current_milestone}
      />

      {/* 最近制品 */}
      {artifacts.length > 0 && <RecentArtifacts artifacts={artifacts} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 主组件
// ---------------------------------------------------------------------------

export function WorkflowStatePanel({
  cwd,
  title,
}: WorkflowStatePanelProps) {
  const { t } = useTranslation();

  // 当 cwd 为空时，显示提示而非发起必然失败的 tRPC 查询
  if (!cwd || cwd.trim() === "") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-shrink-0 border-b px-4 py-3">
          <h3 className="text-sm font-semibold">{title ?? t("ui.workspace.workflowState")}</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NoWorkspaceState />
        </div>
      </div>
    );
  }

  const { data: state, isLoading, error } = useWorkflowState(cwd);

  return (
    <div className="flex h-full flex-col">
      {/* 标题栏 */}
      <div className="flex-shrink-0 border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{title ?? t("ui.workspace.workflowState")}</h3>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && !state ? (
          <LoadingState />
        ) : error ? (
          <ErrorState
            message={error instanceof Error ? error.message : t("ui.panel.unknownError")}
          />
        ) : !state ? (
          <UninitializedState />
        ) : // `"uninitialized" in state` is safe here because the Zod union type guarantees
          // that the discriminant "uninitialized" property is only present on the uninitialized
          // variant. TypeScript discriminated union narrowing applies after this check.
          "uninitialized" in state ? (
          <UninitializedState />
        ) : (
          <ProjectData project={state as ProjectState} />
        )}
      </div>
    </div>
  );
}
