# NFR-SEC-001: Local-Only Security Requirements

| Field | Value |
|-------|-------|
| **ID** | NFR-SEC-001 |
| **Category** | Security - Local Only |
| **Priority** | Must |
| **Trace** | F-004, F-005, SA-01, SA-02 |

## Description

Maestro IDE 定位为本地 Web 应用（SA-01），运行在用户本机，通过 localhost HTTP/WebSocket 服务与浏览器前端通信。安全模型的核心原则是：所有数据和处理 MUST 仅限于用户本机，MUST NOT 暴露任何远程访问接口。CLI 子进程（SA-02）的执行 MUST 在受控的隔离环境中进行，防止未授权的系统访问。

## Requirements

### SEC-001-01: 本地绑定

后端 HTTP 和 WebSocket 服务 MUST 仅绑定到 localhost（`127.0.0.1`），MUST NOT 绑定到 `0.0.0.0` 或任何网络接口。

- 服务 MUST 在启动时验证绑定地址为 localhost。
- 如果因配置错误导致绑定到非 localhost 地址，服务 MUST 拒绝启动并输出明确的错误信息。
- WebSocket 网关 MUST 验证所有传入连接的来源为 localhost，MUST 拒绝非 localhost 连接。

### SEC-001-02: 无远程访问

Maestro IDE MUST NOT 提供任何形式的远程访问能力。

- 产品 MUST NOT 支持 TLS/SSL 配置（本地 HTTP 足够，远程访问不在范围内）。
- 产品 MUST NOT 实现用户认证或授权系统（本地单用户场景无需认证）。
- 产品 MUST NOT 暴露任何 API 到局域网或互联网。
- 产品 MUST NOT 包含任何端口转发或隧道功能。

### SEC-001-03: CLI 进程隔离

后端通过 `node-pty` 管理的 CLI 子进程 MUST 在受控环境中执行。

- 每个子进程 MUST 运行在用户当前工作目录下，MUST NOT 获得超出用户自身权限的系统访问。
- 子进程 MUST NOT 以提升权限（如 sudo/administrator）运行。
- 后端 MUST 对子进程可执行的工作目录进行验证，MUST NOT 允许任意路径遍历。
- 终端会话 MUST 在 WebSocket 断开后 5 秒内完成清理（PTY 终止、资源释放），MUST NOT 留下孤立进程。
- 后端 MUST 强制每个用户最多 5 个并发终端会话，防止资源耗尽攻击。

### SEC-001-04: 输入验证

所有从前端到后端的输入 MUST 经过验证。

- API 端点 MUST 验证请求体的结构和类型，MUST 拒绝格式不正确的请求。
- WebSocket 消息 MUST 验证消息格式和字段类型，MUST 静默丢弃格式错误的消息。
- 终端输入 MUST 通过 PTY 转发，MUST NOT 绕过 PTY 直接执行 shell 命令。
- 工作流触发参数 MUST 经过白名单验证，MUST NOT 允许任意 shell 注入。

### SEC-001-05: 状态数据保护

项目状态数据和工作流执行数据 MUST 仅存在于本地。

- 状态数据 MUST NOT 传输到任何远程服务（Claude Code API 除外，仅限用户主动发起的 AI 对话）。
- 对话历史 MUST 存储在本地文件系统中，MUST NOT 上传到云端。
- 审批记录（diff、dry-run 结果）MUST NOT 离开本机。
- 日志文件 MUST NOT 包含用户的代码内容或项目敏感信息。

## Acceptance Criteria

1. 后端服务 MUST 仅在 `127.0.0.1` 上监听，通过 `netstat` 或 `ss` 验证无其他绑定。
2. 从同一网络的另一台设备 MUST NOT 能访问 Maestro IDE 的任何 API 或 WebSocket 端点。
3. 所有 API 端点 MUST 对格式错误的请求返回 4xx 状态码，MUST NOT 导致后端异常。
4. WebSocket 断开后，MUST NOT 存在孤立的 PTY 子进程（通过进程列表验证）。
5. 终端会话数 MUST 在达到上限（5 个）后拒绝创建新会话，返回明确的错误信息。

## Threat Model

| Threat | Mitigation |
|--------|------------|
| 局域网扫描发现服务 | localhost-only binding (SEC-001-01) |
| WebSocket 跨站劫持 | Origin validation on localhost (SEC-001-01) |
| 恶意终端输入导致命令注入 | PTY passthrough, no direct shell exec (SEC-001-04) |
| 资源耗尽（无限终端会话） | Concurrent session limit (SEC-001-03) |
| 孤立进程积累 | Auto-cleanup on disconnect (SEC-001-03) |
| 数据泄露到远程 | No remote access, local-only storage (SEC-001-02, SEC-001-05) |
