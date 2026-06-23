# REQ-004: Terminal Bridge

| Field | Value |
|-------|-------|
| **ID** | REQ-004 |
| **Feature** | Terminal Bridge |
| **Trace** | F-004 |
| **Priority** | Must |
| **Decisions** | PM-01, PM-05, SA-04, SA-05 |

## Description

Terminal Bridge 在 GUI 中提供嵌入式终端体验。按照 PM-01 的定位，产品是终端辅助工具而非替代 -- Terminal Bridge 的存在是为了让用户看到 maestro 在幕后执行的操作，而非替代用户的主力终端。

嵌入式终端服务两个目的：
1. **透明性**: 用户看到 maestro 工作流的实时 CLI 输出，建立对自动化操作的信任（SA-05）。
2. **逃生舱**: 高级用户可在 GUI 未覆盖其用例时直接与 maestro CLI 交互。

Terminal Bridge 架构上是 F-005（State Sync Engine）的结构化状态数据消费者，同时通过 xterm.js 直接渲染原始 PTY 流。产品决策关于范围 -- 嵌入式终端 MUST NOT 尝试成为全功能终端模拟器。

> **Cross-Role Resolution (C-002)**: SA-06 适配器层仅作用于简单模式；高级模式通过双流（annotated + raw）向前端提供原始 CLI 文本。

## User Story

**As a** 开发者，**I want** 在 GUI 中看到 maestro 工作流执行的实时 CLI 输出，并在需要时直接与 maestro CLI 交互，**So that** 我能了解自动化操作的具体内容，建立对 AI 执行的信任，同时在 GUI 无法覆盖的场景下有逃生路径。

## Acceptance Criteria

1. **AC-004-01**: Terminal Bridge MUST 通过 xterm.js + WebSocket 展示实时 CLI 输出（SA-05）。终端输出 MUST 在 PTY 输出后 100ms 内渲染到 xterm.js 以维持实时感。

2. **AC-004-02**: 嵌入式终端 MUST NOT 尝试替代用户的主力终端或代码编辑器（PM-01, PM-05）。Terminal Bridge SHOULD 支持基本终端交互（滚动、复制、搜索），但 MUST NOT 复制全功能终端模拟器特性（标签页、分屏、配置文件管理）。

3. **AC-004-03**: 终端 MUST 反映后端管理的 maestro 子进程状态，而非任意 shell 会话。用户 MUST 能看到自动化工作流代表其执行的命令。后端 MUST 强制每个用户最多 5 个并发终端会话以限制资源消耗。

4. **AC-004-04**: 每个终端 MUST 使用 `node-pty` 进行 PTY 分配；交互式会话 MUST NOT 使用不带 PTY 的 `child_process.spawn`（xterm.js 需要完整 PTY）。PTY manager MUST 优雅处理 Windows ConPTY 特性，SHOULD 记录 ConPTY 特定错误而不崩溃。

5. **AC-004-05**: 终端会话 MUST 在 WebSocket 断开后 5 秒内完成清理（PTY 终止、资源释放）。后端 SHOULD 在 100ms 内将终端 resize 事件传播到 PTY。

## Interface Contract

| Interface | Direction | Shape |
|-----------|-----------|-------|
| `POST /api/terminals` | Frontend -> Backend | `{ cwd?, command? }` 返回 `{ terminalId }` |
| `DELETE /api/terminals/:id` | Frontend -> Backend | 终止 PTY 进程，返回 `{ exitCode }` |
| `WS event: term:output` | Backend -> Frontend | `{ terminalId, data: string }` (原始 PTY 输出) |
| `WS event: term:input` | Frontend -> Backend | `{ terminalId, data: string }` (按键) |
| `WS event: term:resize` | Frontend -> Backend | `{ terminalId, cols, rows }` |
| `WS event: term:exit` | Backend -> Frontend | `{ terminalId, exitCode }` |

## Dependencies

- **F-005** (State Sync Engine): 进程生命周期事件
- **F-006** (Concept Translator): 简单模式下的 CLI 输出翻译
- **node-pty**: PTY 进程管理
- **xterm.js**: 前端终端渲染
