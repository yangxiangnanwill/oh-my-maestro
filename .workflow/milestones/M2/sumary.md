# Milestone: M2 — Usable: AI & Terminal

**Completed**: 2026-06-22
**Artifacts**: 7 (analyze: 1, plan: 2, execute: 2, review: 1, verify: 1)

## Key Outcomes

M2 在 M1 Foundation 基础上补全了交互能力：

1. **Terminal Bridge** — 基于 node-pty + xterm.js 的嵌入终端，支持多会话 Tab 切换、双模式显示（simple/advanced）、Catppuccin Mocha 主题
2. **AI Dialog** — Claude Code CLI 子进程驱动的自然语言交互，NDJSON 流式输出 + Markdown 渲染（marked.js + highlight.js + DOMPurify），意图自动路由到工作流
3. **EventBus 增强** — skipHistory 选项（高频事件优化）+ WebSocket backpressure 检测（bufferedAmount 阈值保护）
4. **安全加固** — DOMPurify XSS 防护、Shell 白名单验证、PTY 事件回环防护、退出竞态防护

### Architecture Compliance
- C-1: node-pty（非 child_process.spawn）✓
- C-2: DialogManager 复用 DelegateExecutor 的 spawn/parse/emit 模式 ✓
- C-3: WSGateway 和 Translator 无需修改（DIALOG channel 白名单为内部增强）✓

### Test Results
- 128/129 tests passing (1 pre-existing flaky test)
- tsc --noEmit: 0 errors

### Known Gaps (carried to M3)
- LOW: Missing `app.css` referenced by `+layout.svelte` (M1 carry-over)
- MEDIUM: dialog-manager NDJSON chunk test flaky
- DEFERRED: MAINT-002 — SessionManager<T> base class extraction

## Learnings

9 learnings extracted to `.workflow/specs/learnings.md`:
- PTY 事件回环防护：source 标记模式
- NDJSON 跨 chunk 行缓冲模式
- PTY 退出竞态防护：`_exiting` 标记 + 统一清理
- DOMPurify 替代手写 XSS 正则
- Shell 路径白名单验证
- DIALOG Channel 翻译白名单
- Svelte 5 each 块中 xterm.js 挂载：data-attribute 替代 bind:this
- WebSocket backpressure 检测
- EventBus skipHistory 选项

## Next Milestone

M3: Refined — Trust & Polish (v0.3.0)
- Phase 3: Trust & Polish — Approval Gate + 性能优化 + Windows 兼容性
