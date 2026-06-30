import { AlertTriangle, Activity, Briefcase, Loader2 } from "lucide-react";
import { electronTrpc } from "renderer/lib/electron-trpc";
import { useTranslation } from "renderer/contexts/TranslationContext";
import type { RalphSession } from "../../../lib/workflow-state";
import type { RalphPanelProps } from "./types";

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
      <span>{t("ui.panel.loadingRalph")}</span>
    </div>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground">
      <Activity className="h-8 w-8" />
      <p>{t("ui.panel.noRalphSession")}</p>
      <p className="text-xs">{t("ui.panel.ralphHint")}</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm">
      <AlertTriangle className="h-8 w-8 text-amber-500" />
      <p className="text-muted-foreground">{t("ui.panel.fetchRalphFailed")}</p>
      <p className="max-w-[240px] text-xs text-red-500">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 状态徽章
// ---------------------------------------------------------------------------

const statusBadgeMap: Record<string, { label: string; className: string }> = {
  running: {
    label: "运行中",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  completed: {
    label: "已完成",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  paused: {
    label: "已暂停",
    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  failed: {
    label: "失败",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  cancelled: {
    label: "已取消",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  },
};

function StatusBadge({ status }: { status: string }) {
  const badge = statusBadgeMap[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
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
// 会话详情
// ---------------------------------------------------------------------------

function SessionDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}

function SessionData({ session }: { session: RalphSession }) {
  const status = session.status ?? "running";

  return (
    <div className="space-y-4 py-3">
      {/* 会话 ID */}
      <section className="px-4">
        <h4 className="mb-2 text-xs font-medium text-muted-foreground">
          会话信息
        </h4>
        <div className="rounded-lg border bg-card p-3 space-y-1">
          <SessionDetail label="Session ID" value={session.session_id} />
          {session.lifecycle_position && (
            <SessionDetail label="生命周期" value={session.lifecycle_position} />
          )}
          {session.phase !== null && session.phase !== undefined && (
            <SessionDetail label="Phase" value={String(session.phase)} />
          )}
          {session.milestone && (
            <SessionDetail label="Milestone" value={session.milestone} />
          )}
          {session.progress && (
            <SessionDetail label="进度" value={session.progress} />
          )}
          {session.cli_tool && (
            <SessionDetail label="CLI 工具" value={session.cli_tool} />
          )}
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-muted-foreground">状态</span>
            <StatusBadge status={status} />
          </div>
        </div>
      </section>

      {/* 任务信息 */}
      {(session.intent || session.task_type || session.chain_name) && (
        <section className="px-4">
          <h4 className="mb-2 text-xs font-medium text-muted-foreground">
            任务信息
          </h4>
          <div className="rounded-lg border bg-card p-3 space-y-1">
            {session.intent && (
              <SessionDetail label="意图" value={session.intent} />
            )}
            {session.task_type && (
              <SessionDetail label="任务类型" value={session.task_type} />
            )}
            {session.chain_name && (
              <SessionDetail label="命令链" value={session.chain_name} />
            )}
            {session.auto_mode !== null && session.auto_mode !== undefined && (
              <SessionDetail
                label="自动模式"
                value={session.auto_mode ? "开启" : "关闭"}
              />
            )}
          </div>
        </section>
      )}

      {/* 操作按钮（MVP 禁用） */}
      <section className="px-4">
        <h4 className="mb-2 text-xs font-medium text-muted-foreground">
          CLI 操作
        </h4>
        {/* TODO: Activate CLI buttons when command execution channel is implemented (Round 5+) */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled
            className="w-full rounded-md border bg-background px-3 py-1.5 text-xs text-muted-foreground/60 cursor-not-allowed"
          >
            查看 Skills
          </button>
          <button
            type="button"
            disabled
            className="w-full rounded-md border bg-background px-3 py-1.5 text-xs text-muted-foreground/60 cursor-not-allowed"
          >
            检查状态
          </button>
          <button
            type="button"
            disabled
            className="w-full rounded-md border bg-background px-3 py-1.5 text-xs text-muted-foreground/60 cursor-not-allowed"
          >
            下一步
          </button>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 主组件
// ---------------------------------------------------------------------------

export function RalphPanel({ cwd, workspaceId, title }: RalphPanelProps) {
  const { t } = useTranslation();
  const hasWorkspace = Boolean(workspaceId);
  const { data: session, isLoading, error } =
    electronTrpc.maestro.workflow.ralphSession.useQuery(
      { cwd, workspaceId },
      { enabled: hasWorkspace },
    );

  // 当 cwd 为空时，显示提示而非发起必然失败的 tRPC 查询
  if (!hasWorkspace) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-shrink-0 border-b px-4 py-3">
          <h3 className="text-sm font-semibold">{title ?? t("ui.workspace.ralphSession")}</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NoWorkspaceState />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* 标题栏 */}
      <div className="flex-shrink-0 border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{title ?? t("ui.workspace.ralphSession")}</h3>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && !session ? (
          <LoadingState />
        ) : error ? (
          <ErrorState
            message={error instanceof Error ? error.message : t("ui.panel.unknownError")}
          />
        ) : !session ? (
          <EmptyState />
        ) : (
          <SessionData session={session} />
        )}
      </div>
    </div>
  );
}
