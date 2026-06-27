import type { CommandItem } from "lib/trpc/routers/maestro";

/** UI 层映射的 Maestro 命令（精简版，用于渲染） */
export interface MaestroCommand {
  id?: string;
  name: string;
  description: string;
  category: CommandItem["category"];
  cliCommand: string;
  cliArgs: string[];
}

/** 分类显示名称映射 */
export const CATEGORY_LABELS: Record<CommandItem["category"], string> = {
  knowledge: "知识",
  analysis: "分析",
  command: "命令",
  utility: "工具",
};

/** 分类 Badge 颜色映射（Tailwind 类名） */
export const CATEGORY_COLORS: Record<CommandItem["category"], string> = {
  knowledge:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  analysis:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  command:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  utility:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

/** CommandPalette 组件 props */
export interface CommandPaletteProps {
  /** 面板是否打开 */
  isOpen: boolean;
  /** 关闭面板回调 */
  onClose: () => void;
  /** 工作目录路径，用于执行命令 */
  cwd: string;
}
