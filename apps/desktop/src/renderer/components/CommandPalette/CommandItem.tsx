import { Terminal } from "lucide-react";
import { CATEGORY_COLORS, CATEGORY_LABELS, type MaestroCommand } from "./types";

interface CommandItemProps {
  command: MaestroCommand;
  /** 是否高亮（键盘选中） */
  highlighted: boolean;
  /** 点击回调 */
  onSelect: (command: MaestroCommand) => void;
}

/**
 * 单个命令项组件。
 * 显示命令标签（label）、描述、分类 Badge。
 * 选中时高亮背景，点击触发 onSelect。
 */
export function CommandItem({
  command,
  highlighted,
  onSelect,
}: CommandItemProps) {
  const badgeColor = CATEGORY_COLORS[command.category];

  return (
    <button
      type="button"
      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
        highlighted
          ? "bg-accent text-accent-foreground"
          : "hover:bg-muted/50"
      }`}
      onClick={() => onSelect(command)}
      role="option"
      aria-selected={highlighted}
    >
      {/* 图标 */}
      <Terminal className="h-4 w-4 flex-shrink-0 text-muted-foreground" />

      {/* 命令信息 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold truncate">
            {command.label}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${badgeColor}`}
          >
            {CATEGORY_LABELS[command.category]}
          </span>
          <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
            {command.id}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {command.description}
        </p>
      </div>

      {/* 键盘快捷键提示 */}
      <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
        ↵
      </kbd>
    </button>
  );
}
