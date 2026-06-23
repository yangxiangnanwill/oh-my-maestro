# TASK-004: SessionManager<T> 泛型基类提取 [MAINT-002]

## Changes
- `src/lib/server/session-manager.ts` (新建): 创建泛型抽象类 `SessionManager<T>`，包含 `sessions: Map<string, T>`、`MAX_SESSIONS`、`getSessionCount()`、`hasSession()`、`checkMaxSessions(label?)` 方法
- `src/lib/server/terminal-manager.ts`: `TerminalManager extends SessionManager<ActiveTerminal>`，构造函数调用 `super(5)`，移除重复的 `sessions`/`MAX_SESSIONS`/`getSessionCount()` 声明，`createTerminal` 改用 `checkMaxSessions('terminal')`，删除 MAINT-002 TODO 注释
- `src/lib/server/dialog-manager.ts`: `DialogManager extends SessionManager<ActiveDialog>`，构造函数调用 `super(5)`，移除重复的 `sessions`/`MAX_SESSIONS`/`getSessionCount()`/`hasSession()` 声明，`createSession` 改用 `checkMaxSessions('dialog')`，删除 MAINT-002 TODO 注释

## Verification
- [x] `grep -r 'class SessionManager' src/lib/server/session-manager.ts`: 返回 `export abstract class SessionManager<T>` 泛型类定义
- [x] `grep -r 'extends SessionManager' src/lib/server/terminal-manager.ts`: 返回 `extends SessionManager<ActiveTerminal>`
- [x] `grep -r 'extends SessionManager' src/lib/server/dialog-manager.ts`: 返回 `extends SessionManager<ActiveDialog>`
- [x] `grep -r 'MAINT-002' src/lib/server/terminal-manager.ts`: 0 行（TODO 已删除）
- [x] `grep -r 'MAINT-002' src/lib/server/dialog-manager.ts`: 0 行（TODO 已删除）
- [x] `npx vitest run ...terminal-manager.test.ts ...dialog-manager.test.ts`: 46/47 通过，1 个预存测试失败（见下方说明）

## Tests
- [x] `npx vitest run src/lib/server/__tests__/terminal-manager.test.ts`: 26/26 全部通过
- [x] `npx vitest run src/lib/server/__tests__/dialog-manager.test.ts`: 20/21 通过，1 个预存失败（NDJSON 3-chunk 测试）
- [x] `npx tsc --noEmit`: 编译零错误

## Deviations
- **预存测试失败**: `dialog-manager.test.ts` 中 "should handle tool_use, tool_result, and error chunk types" 测试期望 3 个 STREAM_CHUNK 但实际收到 2 个。这是 NDJSON 解析器的预存行为：`spawnClaudeCLI` 中的 `buffer.split('\n')` + `pop()` 会将最后一行（无尾随 `\n`）保留在 buffer 中作为不完整行。本次重构未修改 NDJSON 解析逻辑，此失败与 TASK-004 无关。
- `checkMaxSessions()` 添加了可选 `label` 参数以保持原有错误消息格式（`"Maximum terminal sessions (5) reached"` / `"Maximum dialog sessions (5) reached"`），这是对任务 action 中 `checkMaxSessions(): void` 签名的微调，但保持了公共接口的向后兼容性。

## Notes
- `SessionManager<T>` 中 `sessions` 为 `protected`（非 `private`），子类可直接访问。`dialog-manager.test.ts` 通过类型转换 `(manager as unknown as { sessions: ... })` 直接访问 sessions，运行时仍然可用。
- `index.ts` 无需修改 — `TerminalManager` 和 `DialogManager` 仍从各自文件直接导入，`SessionManager` 作为内部基类不对外暴露。
