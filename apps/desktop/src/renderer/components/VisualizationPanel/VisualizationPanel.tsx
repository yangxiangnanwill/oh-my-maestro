import { AlertTriangle, BarChart3, Briefcase, Loader2, ExternalLink } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "renderer/contexts/TranslationContext";
import { useWorkflowState } from "renderer/hooks/useWorkflowState";
import type { Artifact, ProjectState } from "../../../lib/workflow-state";
import type {
  VisualizationPanelProps,
  VisualizationTab,
  SortField,
  SortDirection,
} from "./types";

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

const TYPE_COLORS: Record<string, string> = {
  analyze: "#3b82f6",
  plan: "#8b5cf6",
  execute: "#22c55e",
  review: "#f97316",
  test: "#eab308",
  debug: "#ef4444",
};

const TYPE_LABELS: Record<string, string> = {
  analyze: "分析",
  plan: "规划",
  execute: "执行",
  review: "审查",
  test: "测试",
  debug: "调试",
};

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
      <span>{t("ui.panel.loadingData")}</span>
    </div>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground">
      <BarChart3 className="h-8 w-8" />
      <p>{t("ui.panel.noData")}</p>
      <p className="text-xs">{t("ui.panel.initHint")}</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm">
      <AlertTriangle className="h-8 w-8 text-amber-500" />
      <p className="text-muted-foreground">{t("ui.panel.fetchDataFailed")}</p>
      <p className="max-w-[240px] text-xs text-red-500">{message}</p>
    </div>
  );
}

function PlaceholderState({ tab }: { tab: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground">
      <BarChart3 className="h-8 w-8" />
      <p>{tab} {t("ui.panel.comingSoon")}</p>
      <p className="text-xs">{t("ui.panel.stayTuned")}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline 视图
// ---------------------------------------------------------------------------

function getTypeColor(type: string): string {
  return TYPE_COLORS[type] ?? "#6b7280";
}

function getTypeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

function formatDate(isoString: string | undefined): string {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "-";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function TimelineView({ artifacts }: { artifacts: Artifact[] }) {
  const { t } = useTranslation();

  const sorted = useMemo(() => {
    return [...artifacts]
      .filter((a) => a.created_at)
      .sort((a, b) => {
        const aTime = new Date(a.created_at!).getTime();
        const bTime = new Date(b.created_at!).getTime();
        return bTime - aTime; // descending
      })
      .slice(0, 20);
  }, [artifacts]);

  if (sorted.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-xs text-muted-foreground">
        {t("ui.panel.noArtifactsTimeline")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max items-end gap-0 px-6 py-6">
        {/* 水平线容器 */}
        <div className="relative flex items-center" style={{ height: 180 }}>
          {/* 水平线 */}
          <div
            className="absolute left-0 right-0 border-t-2 border-border"
            style={{ top: 16 }}
          />

          {/* 节点列表 */}
          <div className="relative flex items-end gap-10">
            {sorted.map((artifact) => {
              const color = getTypeColor(artifact.type);
              const label = getTypeLabel(artifact.type);
              const date = formatDate(artifact.created_at);

              return (
                <div
                  key={artifact.id}
                  className="flex flex-col items-center gap-1.5"
                  style={{ minWidth: 72 }}
                >
                  {/* 圆点 */}
                  <div
                    className="relative z-10 rounded-full border-2 border-background"
                    style={{
                      width: 14,
                      height: 14,
                      backgroundColor: color,
                    }}
                  />

                  {/* 垂直连线到水平线 */}
                  <div
                    className="w-px"
                    style={{
                      height: 8,
                      backgroundColor: color,
                    }}
                  />

                  {/* 信息区 */}
                  <div className="flex flex-col items-center text-center">
                    <span className="max-w-[80px] truncate text-[10px] font-mono font-medium">
                      {artifact.id}
                    </span>
                    <span
                      className="text-[10px]"
                      style={{ color }}
                    >
                      {label}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {date}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cards 视图
// ---------------------------------------------------------------------------

function CardsView({ artifacts }: { artifacts: Artifact[] }) {
  const { t } = useTranslation();

  // 按 type 分组
  const grouped = useMemo(() => {
    const map = new Map<string, Artifact[]>();
    for (const a of artifacts) {
      const list = map.get(a.type);
      if (list) {
        list.push(a);
      } else {
        map.set(a.type, [a]);
      }
    }
    return map;
  }, [artifacts]);

  if (grouped.size === 0) {
    return (
      <div className="px-4 py-8 text-center text-xs text-muted-foreground">
        {t("ui.panel.noArtifactsTimeline")}
      </div>
    );
  }

  // 按 type 排序以保证稳定渲染
  const typeOrder = Array.from(grouped.keys()).sort();

  return (
    <div className="space-y-4 px-3 py-4">
      {typeOrder.map((type) => {
        const items = grouped.get(type)!;
        const color = getTypeColor(type);
        const label = getTypeLabel(type);
        const displayItems = items.slice(0, 5);
        const hasMore = items.length > 5;

        return (
          <div key={type}>
            {/* 分组标题 */}
            <div
              className="mb-2 flex items-center gap-2 rounded-md px-2 py-1"
              style={{ backgroundColor: `${color}15` }}
            >
              <div
                className="rounded-full"
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor: color,
                }}
              />
              <span className="text-xs font-medium" style={{ color }}>
                {label}
              </span>
              <span className="text-[10px] text-muted-foreground">
                ({items.length})
              </span>
            </div>

            {/* 卡片网格 */}
            <div className="grid grid-cols-2 gap-2">
              {displayItems.map((artifact) => (
                <div
                  key={artifact.id}
                  className="rounded-lg border border-border p-2.5 transition-colors hover:bg-accent/5"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-mono font-medium">
                      {artifact.id}
                    </span>
                    {artifact.status && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px]"
                        style={{
                          backgroundColor: `${color}20`,
                          color,
                        }}
                      >
                        {artifact.status}
                      </span>
                    )}
                  </div>
                  {artifact.milestone && (
                    <p className="text-[10px] text-muted-foreground">
                      {artifact.milestone}
                    </p>
                  )}
                  {artifact.created_at && (
                    <p className="mt-1 text-[9px] text-muted-foreground">
                      {formatDate(artifact.created_at)}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* "查看全部" 链接 */}
            {hasMore && (
              <div className="mt-1.5 text-right">
                <button
                  type="button"
                  className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => {
                    // 切换到 table 视图查看全部 — 通过向上传递事件实现
                    // MVP: 仅展示提示
                  }}
                >
                  {t("ui.panel.viewAll")} ({items.length})
                  <ExternalLink className="h-2.5 w-2.5" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 标签页
// ---------------------------------------------------------------------------

const TABS: { key: VisualizationTab; label: string }[] = [
  { key: "timeline", label: "Timeline" },
  { key: "dag", label: "DAG" },
  { key: "cards", label: "Cards" },
  { key: "table", label: "Table" },
];

// ---------------------------------------------------------------------------
// 排序表头
// ---------------------------------------------------------------------------

const COLUMNS: { key: SortField; label: string }[] = [
  { key: "id", label: "ID" },
  { key: "type", label: "Type" },
  { key: "status", label: "Status" },
  { key: "milestone", label: "Milestone" },
  { key: "phase", label: "Phase" },
  { key: "path", label: "Path" },
];

function SortHeader({
  field,
  sortField,
  sortDirection,
  onSort,
  label,
}: {
  field: SortField;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  label: string;
}) {
  const isActive = sortField === field;
  return (
    <th
      className="cursor-pointer select-none px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive && (
          <span className="text-xs">
            {sortDirection === "asc" ? "▲" : "▼"}
          </span>
        )}
      </span>
    </th>
  );
}

// ---------------------------------------------------------------------------
// Table 视图
// ---------------------------------------------------------------------------

function ArtifactRow({ artifact }: { artifact: Artifact }) {
  return (
    <tr className="border-b border-border hover:bg-accent/5">
      <td className="max-w-[120px] truncate px-3 py-2 text-xs font-mono">
        {artifact.id}
      </td>
      <td className="px-3 py-2 text-xs">{artifact.type}</td>
      <td className="px-3 py-2 text-xs">{artifact.status ?? "-"}</td>
      <td className="px-3 py-2 text-xs">{artifact.milestone ?? "-"}</td>
      <td className="px-3 py-2 text-xs">
        {artifact.phase !== null && artifact.phase !== undefined
          ? String(artifact.phase)
          : "-"}
      </td>
      <td className="max-w-[140px] truncate px-3 py-2 text-xs text-muted-foreground">
        {artifact.path ?? "-"}
      </td>
    </tr>
  );
}

function TableView({ artifacts }: { artifacts: Artifact[] }) {
  const { t } = useTranslation();
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
    },
    [sortField],
  );

  // useMemo is O(n log n); fine for <100 artifacts in MVP
  const sorted = useMemo(() => {
    const dir = sortDirection === "asc" ? 1 : -1;
    return [...artifacts].sort((a, b) => {
      if (sortField === "phase") {
        const aVal = a.phase ?? Number.MAX_SAFE_INTEGER;
        const bVal = b.phase ?? Number.MAX_SAFE_INTEGER;
        return (aVal - bVal) * dir;
      }
      const aVal = String(a[sortField] ?? "");
      const bVal = String(b[sortField] ?? "");
      return aVal.localeCompare(bVal) * dir;
    });
  }, [artifacts, sortField, sortDirection]);

  if (artifacts.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-xs text-muted-foreground">
        {t("ui.panel.noArtifacts")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {COLUMNS.map((col) => (
              <SortHeader
                key={col.key}
                field={col.key}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                label={col.label}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((artifact) => (
            <ArtifactRow key={artifact.id} artifact={artifact} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 主组件
// ---------------------------------------------------------------------------

export function VisualizationPanel({
  cwd,
  workspaceId,
  title,
}: VisualizationPanelProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<VisualizationTab>("table");
  const hasWorkspace = Boolean(workspaceId);
  const { data: state, isLoading, error } = useWorkflowState(cwd, {
    workspaceId,
    enabled: hasWorkspace,
  });

  // 当 cwd 为空时，显示提示而非发起必然失败的 tRPC 查询
  if (!hasWorkspace) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-shrink-0 border-b px-4 py-3">
          <h3 className="text-sm font-semibold">{title ?? t("ui.workspace.visualization")}</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NoWorkspaceState />
        </div>
      </div>
    );
  }

  const artifacts: Artifact[] = useMemo(() => {
    // `"uninitialized" in state` is safe here because the Zod union type guarantees
    // that the discriminant "uninitialized" property is only present on the uninitialized
    // variant. TypeScript discriminated union narrowing applies after this check.
    if (!state || "uninitialized" in state) return [];
    const project = state as ProjectState;
    return project.artifacts ?? [];
  }, [state]);

  return (
    <div className="flex h-full flex-col">
      {/* 标题栏 + 标签页 */}
      <div className="flex-shrink-0 border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{title ?? t("ui.workspace.visualization")}</h3>
        <div className="mt-2 flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                activeTab === tab.key
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
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
          <EmptyState />
        ) : "uninitialized" in state ? (
          <EmptyState />
        ) : activeTab === "table" ? (
          <div className="py-3">
            <TableView artifacts={artifacts} />
          </div>
        ) : activeTab === "timeline" ? (
          <TimelineView artifacts={artifacts} />
        ) : activeTab === "cards" ? (
          <CardsView artifacts={artifacts} />
        ) : (
          <PlaceholderState
            tab={TABS.find((tab) => tab.key === activeTab)?.label ?? activeTab}
          />
        )}
      </div>
    </div>
  );
}
