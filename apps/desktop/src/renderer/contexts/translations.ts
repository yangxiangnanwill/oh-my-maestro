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

  // ── UI 字符串 ───────────────────────────────────────────────

  // Dashboard
  "ui.dashboard.title": "仪表盘",
  "ui.dashboard.recentWorkspaces": "最近工作区",
  "ui.dashboard.newWorkspace": "新建工作区",
  "ui.dashboard.quickActions": "快捷操作",
  "ui.dashboard.yourWorkspaces": "工作区与项目",
  "ui.dashboard.noWorkspaces": "暂无工作区",
  "ui.dashboard.createFirst": "点击"新建工作区"创建您的第一个工作区",
  "ui.dashboard.loading": "加载工作区中...",
  "ui.dashboard.loadError": "加载工作区失败",

  // Workspace
  "ui.workspace.overview": "概览",
  "ui.workspace.chat": "对话",
  "ui.workspace.terminal": "终端",
  "ui.workspace.commandChain": "命令链",
  "ui.workspace.knowledge": "知识库",
  "ui.workspace.noWorkspace": "未选择工作区",
  "ui.workspace.backToDashboard": "返回仪表盘",
  "ui.workspace.workspaceId": "工作区 ID",
  "ui.workspace.splitView": "分屏视图",
  "ui.workspace.chatOnly": "仅对话",
  "ui.workspace.terminalOnly": "仅终端",

  // Chat
  "ui.chat.title": "对话",
  "ui.chat.placeholder": "输入消息...",
  "ui.chat.send": "发送",
  "ui.chat.startConversation": "开始对话",
  "ui.chat.hint": "输入消息与 AI 助手对话",
  "ui.chat.thinking": "思考中...",

  // Terminal
  "ui.terminal.title": "终端",

  // Settings
  "ui.settings.title": "设置",
  "ui.settings.appearance": "外观",
  "ui.settings.general": "通用",
  "ui.settings.about": "关于",
  "ui.settings.placeholder": "设置页面 — Phase 4 实现",

  // 通用操作
  "ui.common.loading": "加载中...",
  "ui.common.error": "出错了",
  "ui.common.retry": "重试",
  "ui.common.cancel": "取消",
  "ui.common.confirm": "确认",
  "ui.common.save": "保存",
  "ui.common.delete": "删除",
  "ui.common.unnamedWorkspace": "未命名工作区",
};
