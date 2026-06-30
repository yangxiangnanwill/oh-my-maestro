import { AlertTriangle, Loader2, PackageOpen } from "lucide-react";
import { useTranslation } from "renderer/contexts/TranslationContext";
import type { DashboardWidgetProps } from "./types";

// ---------------------------------------------------------------------------
// 状态组件
// ---------------------------------------------------------------------------

function LoadingState() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{t("ui.panel.loadingData")}</span>
    </div>
  );
}

function EmptyState({ message }: { message?: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground">
      <PackageOpen className="h-8 w-8" />
      <p>{message ?? t("ui.panel.noData")}</p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-8 text-center text-sm">
      <AlertTriangle className="h-8 w-8 text-amber-500" />
      <p className="text-muted-foreground">{t("ui.panel.fetchDataFailed")}</p>
      <p className="max-w-[240px] text-xs text-red-500">{message}</p>
      {onRetry && (
        <button
          type="button"
          className="rounded-md border bg-background px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={onRetry}
        >
          {t("ui.common.retry")}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 主组件
// ---------------------------------------------------------------------------

export function DashboardWidget({
  title,
  actions,
  loading = false,
  empty = false,
  emptyMessage,
  error = null,
  onRetry,
  children,
}: DashboardWidgetProps) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col rounded-lg border bg-card shadow-sm">
      {/* 标题栏 */}
      <div className="flex-shrink-0 flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : empty ? (
          <EmptyState message={emptyMessage} />
        ) : (
          children
        )}
      </div>
    </div>
  );
}
