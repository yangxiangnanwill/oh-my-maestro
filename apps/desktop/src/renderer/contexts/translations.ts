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
  "ui.workspace.ralphSession": "Ralph 会话",
  "ui.workspace.workflowState": "工作流状态",
  "ui.workspace.visualization": "可视化",
  "ui.workspace.noWorkspace": "未选择工作区",
  "ui.workspace.backToDashboard": "返回仪表盘",
  "ui.workspace.workspaceId": "工作区 ID",
  "ui.workspace.splitView": "分屏视图",
  "ui.workspace.chatOnly": "仅对话",
  "ui.workspace.terminalOnly": "仅终端",
  "ui.workspace.selectWorkspaceHint": "请选择工作区以查看数据",

  // Panels — loading / empty / error
  "ui.panel.noWorkspaceMessage": "请选择工作区以查看数据",
  "ui.panel.loadingRalph": "加载 Ralph 会话中...",
  "ui.panel.loadingState": "加载项目状态中...",
  "ui.panel.loadingData": "加载数据中...",
  "ui.panel.noRalphSession": "暂无 Ralph 会话",
  "ui.panel.ralphHint": "请运行 maestro ralph session 启动会话",
  "ui.panel.projectUninitialized": "项目未初始化",
  "ui.panel.initHint": "请先运行 maestro init 初始化项目",
  "ui.panel.noData": "暂无项目数据",
  "ui.panel.noArtifacts": "暂无制品数据",
  "ui.panel.noMilestones": "暂无里程碑信息",
  "ui.panel.fetchRalphFailed": "获取 Ralph 会话状态失败",
  "ui.panel.fetchStateFailed": "获取项目状态失败",
  "ui.panel.fetchDataFailed": "获取数据失败",
  "ui.panel.unknownError": "未知错误",
  "ui.panel.comingSoon": "即将推出",
  "ui.panel.stayTuned": "敬请期待",
  "ui.panel.noArtifactsTimeline": "暂无制品记录",
  "ui.panel.viewAll": "查看全部",

  // Widget
  "ui.widget.loading": "加载中...",
  "ui.widget.empty": "暂无数据",
  "ui.widget.error": "加载失败",
  "ui.widget.retry": "重试",
  "ui.widget.projectStatus": "项目状态",
  "ui.widget.ralphSession": "Ralph 会话",

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

  // ── Command Registry ──────────────────────────────────────────

  // ralph
  "cmd.ralph_skills": "Ralph 技能列表",
  "cmd.ralph_skills.desc": "列出 Ralph 可用的技能和角色配置",
  "cmd.ralph_check": "Ralph 状态检查",
  "cmd.ralph_check.desc": "检查 Ralph 连接状态和配置",
  "cmd.ralph_session": "Ralph 会话信息",
  "cmd.ralph_session.desc": "查看当前 Ralph 会话信息",

  // knowledge
  "cmd.knowledge_search": "知识搜索",
  "cmd.knowledge_search.desc": "跨 spec、knowhow、wiki、代码的语义搜索",
  "cmd.knowledge_load": "知识加载",
  "cmd.knowledge_load.desc": "按类型和分类加载知识条目",

  // ── PresetList ─────────────────────────────────────────────────

  "ui.presetList.title": "命令预设",
  "ui.presetList.empty": "暂无保存的预设",
  "ui.presetList.load": "加载",
  "ui.presetList.delete": "删除",
  "ui.presetList.confirmDelete": "确认删除预设「{name}」？",
  "ui.presetList.loading": "加载预设中...",
  "ui.presetList.error": "加载预设失败",
};
