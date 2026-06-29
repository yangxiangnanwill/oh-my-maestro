import type { CommandCategory } from "lib/commands";
import type { CommandItem } from "lib/trpc/routers/maestro";

/** UI 层映射的 Maestro 命令（精简版，用于渲染） */
export interface MaestroCommand {
  id: string;
  name: string;
  label: string;
  description: string;
  category: CommandCategory;
  cliCommand: string;
  cliArgs: string[];
  outputKind: CommandItem["outputKind"];
  riskLevel: CommandItem["riskLevel"];
  notes?: string;
}

/** 分类显示名称映射 — satisfies 保证每个 CommandCategory 都有对应条目 */
export const CATEGORY_LABELS = {
  workflow: "工作流",
  ralph: "Ralph",
  knowledge: "知识",
  project: "项目",
  debug: "调试",
  config: "配置",
  system: "系统",
} satisfies Record<CommandCategory, string>;

/** 分类 Badge 颜色映射 — satisfies 保证每个 CommandCategory 都有对应条目 */
export const CATEGORY_COLORS = {
  workflow:
    "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  ralph:
    "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  knowledge:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  project:
    "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  debug:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  config:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  system:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
} satisfies Record<CommandCategory, string>;

/** CommandPalette 组件 props */
export interface CommandPaletteProps {
  /** 面板是否打开 */
  isOpen: boolean;
  /** 关闭面板回调 */
  onClose: () => void;
  /** 工作目录路径，用于执行命令 */
  cwd: string;
}
