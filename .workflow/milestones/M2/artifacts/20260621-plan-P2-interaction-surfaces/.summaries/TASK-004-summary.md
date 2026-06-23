# TASK-004 Summary: Orchestration Integration — Server Wiring + Stores + AIDialog

## Status: ✅ COMPLETED

## Files Modified/Created
- `src/lib/server/index.ts` — 修改 (+80/-2): 添加 TerminalManager/DialogManager 属性初始化 + 7 个 REST API 端点 + stop() 资源清理
- `src/lib/server/dialog-manager.ts` — 修改 (+9/-5): 添加 closeAll() 方法，修复 SpawnFn 类型兼容性
- `src/lib/server/translator.ts` — 修改 (+23/-1): 添加 DIALOG channel 白名单检测，跳过对话消息的概念翻译
- `src/lib/client/stores/index.ts` — 修改 (+90/-2): 添加 dialogSessions/dialogMessages/dialogIntents stores + DIALOG channel 事件监听
- `src/lib/client/components/AIDialog.svelte` — 新建 (441 行): 完整聊天 UI，marked.js Markdown 渲染 + highlight.js 代码高亮 + 意图路由显示

## Convergence Criteria Verification
- [x] index.ts 有 terminalManager/dialogManager readonly 属性 — ✅
- [x] 构造函数初始化 terminalManager/dialogManager — ✅
- [x] POST /api/terminal/create 路由 — ✅
- [x] POST /api/dialog/sessions 路由 — ✅
- [x] POST /api/dialog/sessions/:id/message 路由 — ✅
- [x] POST /api/dialog/sessions/:id/close 路由 — ✅
- [x] stores 有 terminalSessions/dialogSessions — ✅
- [x] stores 有 DIALOG/TERMINAL 频道订阅 — ✅
- [x] AIDialog.svelte with Svelte 5 runes — ✅
- [x] AIDialog uses marked.js — ✅
- [x] AIDialog uses highlight.js — ✅
- [x] AIDialog 意图路由显示 (confidence + candidates) — ✅
- [x] AIDialog Catppuccin Mocha 主题 — ✅ 8 种颜色

## Test Results
- Full suite: 129/129 passing (8 test files)
- TypeScript: tsc --noEmit 无错误

## Key Decisions
1. SpawnFn 类型兼容性 — wrapper 函数适配 node:child_process.spawn 重载
2. DIALOG 翻译白名单 — translator.ts 内部检测 sessionId 字段，无需修改 WSGateway (C-3)
3. stores 事件累积模式 — 遵循现有 DelegateEvent→WorkflowExecution 模式
4. marked + highlight.js — 仅注册 4 种语言控制包体积，XSS 防护

## Deviations
- DialogManager 移除了 spawn 默认值 (类型不兼容)，在 index.ts 中使用 wrapper 函数替代
- Translator 的 DIALOG 白名单通过 payload 结构检测实现 (不修改 WSGateway API)
