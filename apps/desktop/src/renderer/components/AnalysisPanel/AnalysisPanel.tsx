import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { electronTrpc } from "renderer/lib/electron-trpc";
import { RiskMatrix } from "./RiskMatrix";
import { ScoreCard } from "./ScoreCard";
import { mapAnalyzeResult, type AnalysisPanelProps } from "./types";

// ---------------------------------------------------------------------------
// 四态渲染辅助组件
// ---------------------------------------------------------------------------

/** 空状态：暂无分析结果 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground">
      <BarChart3 className="h-8 w-8" />
      <p>暂无分析结果</p>
      <p className="text-xs">
        请在工作目录中运行 maestro analyze 生成分析数据
      </p>
    </div>
  );
}

/** 加载状态 */
function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>加载中...</span>
    </div>
  );
}

/** 错误状态 */
function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm">
      <AlertTriangle className="h-8 w-8 text-amber-500" />
      <p className="text-muted-foreground">获取分析结果失败</p>
      <p className="max-w-[240px] text-xs text-red-500">{message}</p>
      {onRetry && (
        <button
          type="button"
          className="mt-2 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90"
          onClick={onRetry}
        >
          重试
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// OverallVerdict 横幅
// ---------------------------------------------------------------------------

interface OverallVerdictBannerProps {
  verdict: string;
  confidence: number;
}

function OverallVerdictBanner({
  verdict,
  confidence,
}: OverallVerdictBannerProps) {
  const isGo = verdict === "GO";
  const isConditional = verdict === "CONDITIONAL_GO";
  const isNoGo = verdict === "NO-GO";

  const bgClass = isGo
    ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
    : isConditional
      ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
      : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800";

  const textClass = isGo
    ? "text-green-700 dark:text-green-400"
    : isConditional
      ? "text-yellow-700 dark:text-yellow-400"
      : "text-red-700 dark:text-red-400";

  const Icon = isGo
    ? CheckCircle
    : isConditional
      ? AlertTriangle
      : ShieldAlert;

  return (
    <div
      className={`flex items-center gap-3 rounded-md border px-4 py-3 ${bgClass}`}
    >
      <Icon className={`h-5 w-5 ${textClass}`} />
      <div className="flex-1">
        <span className={`text-sm font-semibold ${textClass}`}>
          {isGo
            ? "GO — 建议推进"
            : isConditional
              ? "CONDITIONAL GO — 条件满足后可推进"
              : "NO-GO — 不建议推进"}
        </span>
      </div>
      <div className="flex flex-col items-center">
        {/* 环形置信度指标 */}
        <svg
          className="h-10 w-10 -rotate-90"
          viewBox="0 0 36 36"
          aria-label={`总体置信度: ${confidence}%`}
        >
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-muted/20"
          />
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${(confidence / 100) * 88} 88`}
            strokeLinecap="round"
            className={textClass}
          />
        </svg>
        <span className={`text-xs tabular-nums font-medium ${textClass}`}>
          {confidence}%
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 主组件
// ---------------------------------------------------------------------------

export function AnalysisPanel({
  cwd,
  topic,
  title = "分析结果",
}: AnalysisPanelProps) {
  const { data: raw, isLoading, error, refetch } =
    electronTrpc.maestro.analyze.result.useQuery(
      { cwd, topic },
      {},
    );

  // 将后端数据转换为 UI 映射层
  const result = raw ? mapAnalyzeResult(raw) : null;

  return (
    <div className="flex h-full flex-col">
      {/* 标题栏 */}
      <div className="flex-shrink-0 border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && !raw ? (
          <LoadingState />
        ) : error ? (
          <ErrorState
            message={error instanceof Error ? error.message : "未知错误"}
            onRetry={refetch}
          />
        ) : !result ? (
          <EmptyState />
        ) : (
          <div className="space-y-4 py-3">
            {/* 总体判定横幅 */}
            <div className="px-4">
              <OverallVerdictBanner
                verdict={result.overallVerdict}
                confidence={result.overallConfidence}
              />
            </div>

            {/* 建议列表 */}
            {result.recommendations.length > 0 && (
              <section className="px-4">
                <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                  建议
                </h4>
                <ul className="space-y-1">
                  {result.recommendations.map((rec, idx) => (
                    <li
                      key={`rec-${idx}`}
                      className="text-xs text-muted-foreground"
                    >
                      {rec}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 6 维评分卡网格 */}
            <section className="px-4">
              <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                维度评分
              </h4>
              {result.dimensions.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {result.dimensions.map((dim) => (
                    <ScoreCard key={dim.name} dimension={dim} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  暂无维度评分数据
                </p>
              )}
            </section>

            {/* 风险矩阵 */}
            <section className="px-4">
              <RiskMatrix risks={result.risks} />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
