import { AlertTriangle, BarChart3, Briefcase, Loader2 } from "lucide-react";
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
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground">
      <BarChart3 className="h-8 w-8" />
      <p>{tab} 视图即将推出</p>
      <p className="text-xs">敬请期待</p>
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
  title,
}: VisualizationPanelProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<VisualizationTab>("table");

  // 当 cwd 为空时，显示提示而非发起必然失败的 tRPC 查询
  if (!cwd || cwd.trim() === "") {
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

  const { data: state, isLoading, error } = useWorkflowState(cwd);

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
        ) : (
          <PlaceholderState
            tab={TABS.find((tab) => tab.key === activeTab)?.label ?? activeTab}
          />
        )}
      </div>
    </div>
  );
}
