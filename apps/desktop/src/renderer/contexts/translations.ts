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
  "cmd.spec_load": "Spec 加载",
  "cmd.spec_load.desc": "按分类加载项目 spec 条目",
  "cmd.knowhow_search": "Knowhow 搜索",
  "cmd.knowhow_search.desc": "搜索 knowhow 知识条目",
  "cmd.wiki_search": "Wiki 搜索",
  "cmd.wiki_search.desc": "搜索 wiki 文档",
  "cmd.wiki_health": "Wiki 健康检查",
  "cmd.wiki_health.desc": "检查 wiki 系统健康状态",
  "cmd.wiki_graph": "Wiki 图谱",
  "cmd.wiki_graph.desc": "查看 wiki 知识图谱结构",
  "cmd.domain_list": "领域列表",
  "cmd.domain_list.desc": "列出所有领域定义",
  "cmd.kg_query": "KG 查询",
  "cmd.kg_query.desc": "直接查询知识图谱符号",
  "cmd.kg_context": "KG 上下文",
  "cmd.kg_context.desc": "获取知识图谱节点的上下文信息",
  "cmd.kg_callers": "KG 调用者",
  "cmd.kg_callers.desc": "查找函数的所有调用者",
  "cmd.kg_callees": "KG 被调用者",
  "cmd.kg_callees.desc": "查找函数调用的所有子函数",

  // project
  "cmd.milestone_audit": "里程碑审计",
  "cmd.milestone_audit.desc": "审计项目里程碑完成状态",
  "cmd.manage_status": "项目状态",
  "cmd.manage_status.desc": "查看项目当前状态概览",
  "cmd.manage_issue_discover": "问题发现",
  "cmd.manage_issue_discover.desc": "从多视角发现潜在问题",

  // debug
  "cmd.security_audit": "安全审计",
  "cmd.security_audit.desc": "OWASP Top 10 和 STRIDE 安全审计",
  "cmd.learn_follow": "学习跟踪",
  "cmd.learn_follow.desc": "跟踪学习主题进展",
  "cmd.learn_investigate": "假设调查",
  "cmd.learn_investigate.desc": "假设驱动的调查和证据记录",
  "cmd.learn_second_opinion": "第二意见",
  "cmd.learn_second_opinion.desc": "从不同角度获取第二意见",

  // system
  "cmd.explore": "代码探索",
  "cmd.explore.desc": "多角度代码库扫描和发现",
  "cmd.workspace_list": "工作区列表",
  "cmd.workspace_list.desc": "列出所有可用工作区",

  // config
  "cmd.overlay_list": "覆盖层列表",
  "cmd.overlay_list.desc": "列出配置覆盖层",
  "cmd.hooks_status": "钩子状态",
  "cmd.hooks_status.desc": "查看钩子配置状态",
  "cmd.delegate_show": "委派详情",
  "cmd.delegate_show.desc": "查看委派任务详情",
};
