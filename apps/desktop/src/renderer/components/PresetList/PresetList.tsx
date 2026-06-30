import {
  Clock,
  Command,
  Loader2,
  Play,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "renderer/contexts/TranslationContext";
import {
  deletePreset,
  loadPresets,
  type CommandPreset,
} from "renderer/lib/presets";
import type { PresetListProps } from "./types";

// ---------------------------------------------------------------------------
// 状态组件
// ---------------------------------------------------------------------------

function LoadingState() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{t("ui.presetList.loading")}</span>
    </div>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
      <Command className="h-8 w-8" />
      <p>{t("ui.presetList.empty")}</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center text-sm">
      <p className="text-muted-foreground">{t("ui.presetList.error")}</p>
      <p className="max-w-[240px] text-xs text-red-500">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 格式化工具
// ---------------------------------------------------------------------------

/** 将 ISO 时间戳格式化为简短本地时间字符串 */
function formatSavedAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${h}:${min}`;
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// PresetList
// ---------------------------------------------------------------------------

/**
 * PresetList — 已保存的命令预设列表。
 *
 * 从 localStorage 加载预设数据，支持按 commandId 过滤。
 * 每个预设卡片展示名称、命令 ID badge、参数预览和保存时间。
 * MVP 阶段"加载"按钮仅 console.log 预设数据。
 */
export function PresetList({ commandId }: PresetListProps) {
  const { t } = useTranslation();
  const [presets, setPresets] = useState<CommandPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载预设
  const refresh = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      const all = loadPresets();
      const filtered = commandId
        ? all.filter((p) => p.commandId === commandId)
        : all;
      setPresets(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [commandId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // 按保存时间降序排列
  const sorted = useMemo(
    () =>
      [...presets].sort(
        (a, b) =>
          new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
      ),
    [presets],
  );

  // 处理加载
  const handleLoad = useCallback((preset: CommandPreset) => {
    // MVP: read-only 模式，仅记录选择
    console.log("[PresetList] Load preset:", preset);
  }, []);

  // 处理删除（带确认）
  const handleDelete = useCallback(
    (preset: CommandPreset) => {
      const confirmMsg = t("ui.presetList.confirmDelete").replace(
        "{name}",
        preset.name,
      );
      if (window.confirm(confirmMsg)) {
        try {
          deletePreset(preset.id);
          refresh();
        } catch {
          // 删除失败时刷新以恢复 UI 一致性
          refresh();
        }
      }
    },
    [refresh, t],
  );

  // 加载中
  if (loading) return <LoadingState />;

  // 加载出错
  if (error) return <ErrorState message={error} />;

  // 无预设
  if (sorted.length === 0) return <EmptyState />;

  return (
    <div className="space-y-2">
      {sorted.map((preset) => (
        <div
          key={preset.id}
          className="rounded-lg border bg-card p-3 text-sm"
        >
          {/* 标题行：名称 + commandId badge */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-medium truncate">{preset.name}</span>
            <span className="inline-flex items-center rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              {preset.commandId}
            </span>
          </div>

          {/* 描述 */}
          {preset.description && (
            <p className="text-xs text-muted-foreground mb-1.5 line-clamp-2">
              {preset.description}
            </p>
          )}

          {/* 参数预览 */}
          {preset.args.length > 0 && (
            <div className="mb-1.5">
              <code className="block rounded bg-muted px-2 py-1 text-[11px] font-mono text-muted-foreground break-all">
                {preset.args.join(" ")}
              </code>
            </div>
          )}

          {/* 底部：保存时间 + 操作按钮 */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatSavedAt(preset.savedAt)}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleLoad(preset)}
                className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs hover:bg-muted transition-colors"
                aria-label={t("ui.presetList.load")}
              >
                <Play className="h-3 w-3" />
                {t("ui.presetList.load")}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(preset)}
                className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                aria-label={t("ui.presetList.delete")}
              >
                <Trash2 className="h-3 w-3" />
                {t("ui.presetList.delete")}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
