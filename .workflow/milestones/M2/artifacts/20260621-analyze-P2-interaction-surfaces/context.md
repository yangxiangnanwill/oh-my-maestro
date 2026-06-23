# Context: Phase 2 — Interaction Surfaces

**Date**: 2026-06-21
**Session**: ANL-002
**Areas discussed**: 架构设计, 实现方案, 性能分析, 安全性

## Decisions

### Decision 1: node-pty 用于 Terminal Bridge
- **Context**: Terminal Bridge 需要交互式终端支持（ANSI 序列、resize、交互程序）
- **Options**:
  1. node-pty — 原生 PTY 分配，完整终端语义
  2. child_process.spawn — 零额外依赖，但无 PTY 语义
- **Chosen**: node-pty
- **Reason**: 交互式终端需要 PTY 语义；spawn 无法支持 resize 和交互程序（vim/nano）

### Decision 2: DialogManager 复用 DelegateExecutor 模式
- **Context**: AI Dialog 需要管理 Claude Code CLI 子进程
- **Options**:
  1. 复用 DelegateExecutor 的 spawn/parse/emit 模式
  2. 新建独立的子进程管理架构
- **Chosen**: 复用 DelegateExecutor 模式
- **Reason**: 相同的子进程管理需求，模式已通过 M1 验证；减少新代码量，保持架构一致性

### Decision 3: WSGateway 和 Translator 无需修改
- **Context**: Phase 2 消息需要路由和翻译
- **Options**:
  1. 修改 WSGateway 添加专用处理分支
  2. 依赖现有 default 转发 + 自动翻译
- **Chosen**: 不修改
- **Reason**: default 分支已转发未知消息到 EventBus；Translator 自动应用于所有 object payload

### Decision 4: PTY 输出帧节流（33ms ≈ 30fps）
- **Context**: 高频 PTY 输出（2000 行/秒）会导致 3.3x 积压因子
- **Options**:
  1. 帧节流（33ms 累积 → 单次 WS 发送）
  2. 动态分块（大小/时间双阈值）
  3. 不做节流（接受积压）
- **Chosen**: 帧节流
- **Reason**: 降低 98.5% 帧数；匹配 xterm.js 渲染周期；实现简单

### Decision 5: NDJSON 协议用于 Claude Code CLI 通信
- **Context**: DialogManager 需要与 Claude Code CLI 子进程通信
- **Options**:
  1. NDJSON（每行一个 JSON 对象）
  2. JSON-RPC
  3. 纯文本
- **Chosen**: NDJSON
- **Reason**: 复用 DelegateExecutor 的 parseLine 基础设施；结构化但简单

### Decision 6: 两阶段意图路由
- **Context**: 用户自然语言输入需要路由到工作流
- **Options**:
  1. 纯关键词匹配
  2. 纯 LLM 语义理解
  3. 两阶段（关键词 + LLM）
- **Chosen**: 两阶段
- **Reason**: 关键词提供 <10ms 快速过滤；LLM 提供精确匹配；平衡速度和准确性

## Constraints

### Locked

| # | Constraint | Rationale | Ref |
|---|-----------|-----------|-----|
| C-1 | node-pty 用于 Terminal Bridge | PTY 语义是硬需求 | Decision 1 |
| C-2 | DialogManager 复用 DelegateExecutor 模式 | 架构一致性 | Decision 2 |
| C-3 | WSGateway 和 Translator 不修改 | 现有功能已覆盖 | Decision 3 |
| C-4 | PTY 输出必须帧节流（33ms） | 防止事件循环阻塞 | Decision 4 |
| C-5 | ws.bufferedAmount 背压检查（16KB） | 防止内存泄漏 | Round 2 |
| C-6 | NDJSON 协议用于 Claude Code CLI | 复用解析基础设施 | Decision 5 |
| C-7 | 终端事件使用独立环形缓冲区 | O(1) 覆盖 | Round 2 |
| C-8 | 翻译结果按显示模式缓存 | 减少重复计算 | Round 2 |

### Free

| # | Area | Implementer's Choice |
|---|------|---------------------|
| F-1 | xterm.js WebGL addon | 可选 — 提升渲染性能但增加依赖 |
| F-2 | Markdown 渲染库 | marked.js 推荐，但可用其他库替代 |
| F-3 | 代码高亮库 | highlight.js 推荐（190+ 语言） |
| F-4 | 多会话上限 | 建议 5（MVP），可根据需要调整 |
| F-5 | 前端轮询优化 | 可用 CustomEvent 替代 setInterval |

### Deferred

| # | Item | Reason | Phase |
|---|------|--------|-------|
| D-1 | 会话持久化（SQLite 存储对话历史） | MVP 范围外 | Phase 3 |
| D-2 | 终端输出搜索 | MVP 范围外 | Phase 3 |
| D-3 | AI 对话导出 | MVP 范围外 | Phase 3 |
| D-4 | 终端主题定制 | MVP 范围外 | Phase 3 |

## Code Context

### 新增文件
```
src/lib/server/terminal-manager.ts    # PTY 生命周期管理
src/lib/server/dialog-manager.ts      # AI 对话子进程管理
src/lib/client/components/TerminalBridge.svelte  # xterm.js 终端组件
src/lib/client/components/AIDialog.svelte        # AI 对话组件
```

### 修改文件
```
src/lib/server/index.ts               # 组装 TerminalManager + DialogManager
src/lib/client/stores/index.ts        # 添加 terminal/dialog stores
src/lib/server/event-bus.ts           # skipHistory + 环形缓冲区
src/lib/server/ws-gateway.ts          # bufferedAmount 背压检查
src/routes/+page.svelte               # 激活 Quick Actions 按钮
src/lib/shared/types.ts               # 扩展 DialogSession.messages, TerminalSession.buffer
```

### 新增 npm 依赖
```
node-pty, @xterm/xterm, @xterm/addon-fit, marked, highlight.js
```

### 关键扩展点
- `delegate-executor.ts:35-43` — 依赖注入模式参考
- `delegate-executor.ts:144-163` — NDJSON parseLine 模式参考
- `ws-gateway.ts:115-118` — default 消息转发（零修改接入）
- `ws-gateway.ts:135-141` — 自动翻译（零修改覆盖）
- `events.ts:6-8` — DIALOG/TERMINAL 通道已预留
- `types.ts:69-85` — DialogSession/TerminalSession 类型已预留

## Interview Decisions

| # | Decision | Choice | Source |
|---|----------|--------|--------|
| 1 | 分析方向 | 架构设计 + 实现方案 + 性能 + 安全 | user |
| 2 | 分析深度 | 深度分析 | user |
| 3 | Round 2 反馈 | 继续深入 performance | user |
| 4 | Round 2 深入方向 | PTY 吞吐 + WS 延迟 + EventBus 历史 + 换角度 | user |
| 5 | Round 3 反馈 | 继续深入 implementation | user |
| 6 | Round 3 深入方向 | Claude Code 协议 + Markdown + 意图路由 + 多会话 | user |
