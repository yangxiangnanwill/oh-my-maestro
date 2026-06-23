/**
 * Maestro 术语 → 用户友好中文翻译注册表。
 *
 * 所有翻译键使用 snake_case，与 Maestro 内部术语保持一致。
 * 翻译值面向不熟悉 CLI 的开发者，提供直观的中文概念映射。
 */
export const TRANSLATIONS: Record<string, string> = {
  // 核心概念
  chain: "工作流",
  phase: "阶段",
  wave: "批次",
  task: "任务",
  step: "步骤",

  // 决策与状态
  decision: "决策",
  decision_node: "决策节点",
  status: "状态",
  pending: "等待中",
  running: "执行中",
  completed: "已完成",
  completion_confirmed: "已完成确认",
  failed: "失败",

  // 元数据
  duration: "耗时",
};
