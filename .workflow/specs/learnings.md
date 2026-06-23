---
title: "Learnings"
readMode: optional
priority: medium
category: learning
keywords:
  - bug
  - lesson
  - gotcha
  - learning
---

# Learnings

Add entries with: `/spec-add learning <description>`

## Entries

<spec-entry category="learning" keywords="dependency-injection, subprocess, execFn, spawnFn, testability" date="2026-06-21" source="execute">
  **Dependency Injection for Subprocess Calls**: Use constructor parameters (execFn, spawnFn) with defaults from node:child_process instead of module-level vi.mock. Benefits: type-safe, no hoisting issues, explicit dependencies, works with any test framework. Pattern: `constructor(private execFn = exec)` then `this.execFn('maestro --version')`.
</spec-entry>

<spec-entry category="learning" keywords="NDJSON, stream-parsing, error-strategy, resilience" date="2026-06-21" source="execute">
  **Different Error Strategies for Stream vs Batch Parsing**: Stream parsers (DelegateExecutor.parseLine) should return null for invalid lines — streams may contain partial writes. Batch parsers (DefaultCLIAdapter.parseSkillsOutput) should throw on malformed input — one-shot invocation expects complete valid data. Never use the same error strategy for both.
</spec-entry>

<spec-entry category="learning" keywords="wave-merge, parallel-execution, file-conflict, optimization" date="2026-06-21" source="execute">
  **Safe Wave Merging When No File Conflicts**: Tasks from different waves can be executed concurrently if they have zero file overlap, even if they have logical dependencies. Frontend-only tasks and server-only tasks can safely run in parallel. Always verify with collision detection before merging waves.
</spec-entry>

<spec-entry category="learning" keywords="eventbus, integration-backbone, publish-subscribe, server-architecture" date="2026-06-21" source="execute">
  **EventBus as Integration Backbone**: All server-side components (DelegateExecutor, StateSyncEngine, WSGateway) communicate through EventBus with typed events and channels. New components naturally emit to existing channels (WorkflowEvents, Channels.WORKFLOW). This decouples producers from consumers and enables testing with real EventBus.
</spec-entry>

<spec-entry category="learning" keywords="svelte-effect, subscription-cleanup, memory-leak, reactive" date="2026-06-21" source="milestone-complete">
  **Svelte 5 $effect Subscription Cleanup Pattern**: When using `store.subscribe()` inside `$effect`, always return the unsubscribe function. Svelte 5 automatically calls the returned cleanup function when the effect re-runs or component unmounts. Pattern: `$effect(() => { const unsub = store.subscribe(fn); return unsub; })`. Without the return, each re-run creates a new subscription without cleaning up the old one, causing memory leaks.
  Milestone: M1
</spec-entry>

<spec-entry category="learning" keywords="type-contract, data-migration, test-update, ParamDef" date="2026-06-21" source="milestone-complete">
  **Type Contract Changes Require Full Test Data Migration**: When changing a shared type (e.g., `WorkflowMeta.params` from `Record<string, unknown>` to `ParamDef[]`), ALL test fixtures using the old shape must be updated. Missing even one test fixture causes compilation failures that cascade across the test suite. Always grep for all usages of the changed type before committing.
  Milestone: M1
</spec-entry>

<spec-entry category="learning" keywords="data-contract, event-accumulation, DelegateEvent, WorkflowExecution, type-mapping" date="2026-06-21" source="milestone-complete">
  **Event Accumulation Pattern for Data Contract Bridging**: When upstream events (DelegateEvent) have a different shape than downstream consumers expect (WorkflowExecution), use an accumulation map (`Map<executionId, WorkflowExecution>`) that extracts fields from incoming events and incrementally builds the target shape. Add defensive checks for existing entries (update vs push) and terminal state protection to prevent mutation of completed/cancelled/failed executions.
  Milestone: M1
</spec-entry>

<spec-entry category="learning" keywords="ws-message, shared-mutation, per-client, object-creation" date="2026-06-21" source="milestone-complete">
  **Per-Client Message Object Creation in WebSocket Broadcasts**: When broadcasting to multiple WebSocket clients, create a new message object inside the iteration loop — not outside. A shared message object created before the loop risks payload mutation where one client's translated payload overwrites another's. Pattern: `for (const client of clients) { const message = { ... }; /* modify per-client */; client.send(message); }`
  Milestone: M1
</spec-entry>

<spec-entry category="learning" keywords="error-discrimination, instanceof, catch-all, UnsupportedVersionError" date="2026-06-21" source="milestone-complete">
  **Error Type Discrimination in init() Bootstrap**: Use `instanceof` checks in catch blocks to distinguish known error types from unexpected ones. Known errors (e.g., `UnsupportedVersionError`) get graceful degradation (warn + fallback), while unknown errors get full error logging. This prevents catch-all handlers from silently swallowing critical failures.
  Milestone: M1
</spec-entry>

<spec-entry category="learning" keywords="pty, terminal, event-loop, source-guard, double-write" date="2026-06-22" source="milestone-complete">

### PTY 事件回环防护：source 标记模式

当 TerminalManager 通过 `writeToTerminal()` 写入 PTY 时，会发布 `term:input` 事件以通知客户端回显。但 TerminalManager 自身也订阅 `term:input` 事件来向 PTY 写入数据。若不加以区分，`writeToTerminal` 发布的 INPUT 事件会被自身订阅捕获，导致 PTY 双重写入。

**解决方案**：在 EventBus.publish 时添加 `source: 'server'` 标记，订阅端检查 `event.source === 'server'` 跳过自身发布的事件。这是一个轻量级的发布者身份标记模式，无需修改 EventBus 核心架构。

Milestone: M2
</spec-entry>

<spec-entry category="learning" keywords="NDJSON, stream-buffer, cross-chunk, line-splitting, stdout" date="2026-06-22" source="milestone-complete">

### NDJSON 跨 chunk 行缓冲模式

子进程 stdout 的 `data` 事件不保证在 JSON 行边界处分割。当 NDJSON 行跨越两个 chunk 时，简单的 `split('\n')` 会丢失尾部不完整行。

**标准模式**：`buffer += chunk; const lines = buffer.split('\n'); buffer = lines.pop() || '';` — 追加到缓冲区 → 按行分割 → 最后一行（可能不完整）保留在缓冲区等待下一个 chunk。这是 Node.js 社区处理流式行数据的经典做法，适用于所有 NDJSON/JSONL 流式输出场景。

Milestone: M2
</spec-entry>

<spec-entry category="learning" keywords="pty, cleanup, dedup, _exiting, exit-race" date="2026-06-22" source="milestone-complete">

### PTY 退出竞态防护：`_exiting` 标记 + 统一清理方法

PTY 进程退出时存在竞态条件：用户调用 `destroyTerminal()` 触发 `pty.kill()`，同时 PTY 自身也可能触发 `onExit` 回调。两者都会尝试清理会话资源，导致重复的 EXIT 事件发布。

**解决方案**：
1. 在调用 `pty.kill()` 前设置 `_exiting = true` 标记
2. `onExit` 回调检查 `_exiting` 标记，若已设置则跳过清理
3. 提取 `cleanupSession()` 统一清理方法（flush buffer → 清除 timer → delete session → 发布 EXIT），避免 `destroyTerminal` 和 `handlePtyExit` 中的重复代码

Milestone: M2
</spec-entry>

<spec-entry category="learning" keywords="DOMPurify, XSS, sanitize, marked, markdown" date="2026-06-22" source="milestone-complete">

### 用 DOMPurify 替代手写 XSS 正则

手写 XSS 过滤正则（如 `/<script[^>]*>.*?<\/script>/gi`）容易遗漏攻击向量（事件处理器注入、CSS expression、data URI 等）。DOMPurify 是经过大量安全审计的成熟库，覆盖 OWASP XSS 攻击向量。

**迁移模式**：将 `sanitizeHtml(marked.parse(text))` 替换为 `DOMPurify.sanitize(marked.parse(text))`，catch 分支同样替换。安装 `@types/dompurify` 获取 TypeScript 类型支持。

Milestone: M2
</spec-entry>

<spec-entry category="learning" keywords="shell, whitelist, path-traversal, security, spawn" date="2026-06-22" source="milestone-complete">

### Shell 路径白名单验证防止命令注入

当允许用户指定 shell 路径时，攻击者可能通过路径遍历（如 `../../malicious.exe`）或指定任意可执行文件来执行恶意代码。

**防护模式**：
1. 使用 `path.basename(shell)` 提取纯文件名，消除路径遍历
2. 维护 `SHELL_WHITELIST` Set 包含合法 shell（powershell.exe, cmd.exe, pwsh.exe, bash, zsh, sh, fish, dash）
3. 在 spawn 前检查文件名是否在白名单中，不在则抛出 Error

Milestone: M2
</spec-entry>

<spec-entry category="learning" keywords="DIALOG, translator, whitelist, channel, concept-translation" date="2026-06-22" source="milestone-complete">

### DIALOG Channel 翻译白名单：防止聊天消息被概念翻译损坏

TranslatorMiddleware 的概念翻译会将技术术语替换为用户友好文本。但 AI 对话消息（Markdown/ANSI/代码块）不应经过概念翻译，否则会损坏代码片段和技术内容。

**解决方案**：在 `translator.ts` 中添加 `shouldTranslateChannel()` 方法，检测 payload 是否包含 `sessionId` 字段（DIALOG channel 特有），若包含则跳过翻译。这是一个基于 payload 结构特征的启发式检测，无需修改 WSGateway 的广播路径。

Milestone: M2
</spec-entry>

<spec-entry category="learning" keywords="terminal, xterm, svelte5, data-attribute, mount" date="2026-06-22" source="milestone-complete">

### Svelte 5 each 块中 xterm.js 挂载：data-attribute 替代 bind:this

在 Svelte 5 的 `{#each}` 块中，`bind:this` 无法可靠地绑定到动态创建的 DOM 元素。xterm.js 需要通过 `terminal.open(container)` 挂载到 DOM 容器。

**解决方案**：使用 `data-terminal-id={term.terminalId}` 属性标记容器，在 `$effect` 中通过 `document.querySelector(`[data-terminal-id="${id}"]`)` 查找容器并调用 `terminal.open()`。`$effect` 返回 cleanup 函数用于组件卸载时 dispose terminal 实例。

Milestone: M2
</spec-entry>

<spec-entry category="learning" keywords="backpressure, websocket, bufferedAmount, flow-control" date="2026-06-22" source="milestone-complete">

### WebSocket backpressure 检测：bufferedAmount 阈值保护

当客户端消费速度低于服务端推送速度时，WebSocket 内部缓冲区持续增长，最终导致内存溢出。

**防护模式**：在 `sendToClient()` 中检查 `client.ws.bufferedAmount > 16384`（16KB），超阈值时 `console.warn` 并跳过发送。16KB 是经验阈值，平衡了延迟与内存安全。注意使用 `console.warn` 而非 `console.error` — backpressure 是预期内的流控行为，不是错误。

Milestone: M2
</spec-entry>

<spec-entry category="learning" keywords="skipHistory, eventbus, high-frequency, optimization" date="2026-06-22" source="milestone-complete">

### EventBus skipHistory 选项：高频事件的历史存储优化

终端输出（`term:output`）和流式聊天（`dialog:stream-chunk`）是高频事件，每秒可达数十次。将这些事件存入 EventBus history 数组会导致内存快速增长且无实际价值（新客户端不需要回放历史终端输出）。

**解决方案**：在 `EventBus.publish()` 添加 `options?: { skipHistory?: boolean }` 参数。`skipHistory=true` 时跳过 `history.push()` 和长度裁剪，但仍正常通知所有订阅者。向后兼容：不传 options 时行为不变。

Milestone: M2
</spec-entry>
<spec-entry category="learning" keywords="路径遍历, 空字节注入, resolve, normalize, path-security" date="2026-06-23" source="milestone-complete">

### 路径遍历检测：resolve===normalize 无效，需用 sep 分割检查 .. 段

`path.resolve(val)` 和 `path.normalize(val)` 都会将 `..` 解析为实际路径，因此 `resolve(val) === normalize(val)` 的比较无法检测路径遍历攻击（如 `../../etc/passwd`）。

**正确方法**：使用 `resolve(val).split(sep)` 然后检查 `segments.includes("..")`。同时检查 `val.includes("\0")` 防止空字节注入绕过。

**模式**：
```typescript
import { resolve, sep } from "node:path";
function isPathSafe(cwd: string): boolean {
  if (!cwd || cwd.includes("\0")) return false;
  return !resolve(cwd).split(sep).includes("..");
}
```

两个入口（tRPC input refine + 文件系统读取函数）应使用相同的校验逻辑。

Milestone: F2
</spec-entry>

<spec-entry category="learning" keywords="type-guard, isRecord, as-assertion, TypeScript" date="2026-06-23" source="milestone-complete">

### isRecord() type guard 替代 as Record<string, unknown> 断言

`as Record<string, unknown>` 是危险的类型断言，绕过了 TypeScript 的类型检查。使用自定义 type guard 更安全：

```typescript
function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
```

`!Array.isArray(v)` 是必要的，因为 `typeof [] === "object"`。在 map 回调中使用 type guard 后，需用 `.filter()` 过滤 null 元素并提供类型谓词 `(s): s is TargetType => s !== null`。

注意：TypeScript 在某些情况下需要显式的 `!== null` 检查来收窄类型，即使 `isRecord()` 已包含该检查。这不是冗余——是 TypeScript 控制流分析的局限。

Milestone: F2
</spec-entry>

<spec-entry category="learning" keywords="无状态函数, class-removal, setInterval, 可测试性" date="2026-06-23" source="milestone-complete">

### 无状态异步函数优于带定时器的 Class 单例

原 `CommandChainStatusPoller` 类使用 `setInterval` 定时器 + 模块级单例 + `readFileSync`，导致：测试困难（需要等待定时器）、内存管理复杂（需要 stop/cleanup）、单例污染模块状态。

**重构方案**：改为导出无状态异步函数 `readCommandChainStatus(cwd: string): Promise<CommandChainStatus | null>`，使用 `fs/promises readFile`，由调用方决定轮询策略（React Query `refetchInterval: 2000` 替代 `setInterval`）。

轮询逻辑属于 UI 层关注点，不应混入数据读取层。

Milestone: F2
</spec-entry>

<spec-entry category="learning" keywords="patch, git, 回滚, 可逆性" date="2026-06-23" source="milestone-complete">

### .patches/ 目录用于可回滚的自动修复

使用 `git format-patch` 生成 `.patch` 文件到 `.workflow/.patches/` 目录，提供可审计的变更历史和回滚能力。每个 TASK 对应一个独立的 patch 文件，通过 `git am` 应用，`git am --abort` 回滚。

适合自动修复场景（AI agent 批量修改）。与直接 `git commit` 互补：patch 提供更细粒度的可逆性。

注意：单个 patch 文件可能很大（>50MB），建议配置 Git LFS 或定期清理旧 patches。

Milestone: F2
</spec-entry>
