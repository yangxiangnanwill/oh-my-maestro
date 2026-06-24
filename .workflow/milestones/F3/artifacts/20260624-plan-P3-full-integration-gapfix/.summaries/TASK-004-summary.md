# TASK-004: 添加 maestro CLI PATH 检测

## Changes
- `apps/desktop/src/main/lib/agent-setup/maestro-mcp-provider.ts`:
  - 在 `MaestroMcpProviderState` 接口添加 `maestroAvailable: boolean` 字段
  - 在 `state` 对象初始化添加 `maestroAvailable: false`
  - 导入 `execFile` 从 `node:child_process`
  - 新增 `export function checkMaestroCliAvailable(): Promise<boolean>` 函数:
    - Windows 使用 `where maestro`，macOS/Linux 使用 `which maestro`
    - 使用 `execFile` 异步检测，5 秒超时
    - 检测结果通过 `console.log`/`console.warn` 记录
    - 任何错误（超时、命令不存在、非零退出码）都返回 `false`
  - 更新 `registerMaestroMcpProvider()`:
    - 启动时调用 `checkMaestroCliAvailable()` 并缓存到 `state.maestroAvailable`
    - 仅在 `state.maestroAvailable === true` 时尝试 `tryLoadMcpSdk()` 和 `tryMcpHandshake()`
    - 不可用时记录 warn 日志并使用静态 tool catalog
- `apps/desktop/src/main/index.ts`:
  - 导入 `checkMaestroCliAvailable`
  - 在 `registerMaestroMcpProvider()` 前调用 `checkMaestroCliAvailable()` 进行预检
  - 如果 CLI 不可用，记录 warn 日志

## Verification
- [x] `grep -c "checkMaestroCliAvailable"` 在 provider 中返回 >=1: 2 处匹配（函数定义 + 调用）
- [x] `grep -c "maestroAvailable"` 在 provider 中返回 >=1: 5 处匹配（接口、初始化、注释、赋值、条件判断）
- [x] `grep -c "checkMaestroCliAvailable"` 在 main/index.ts 中返回 >=1: 2 处匹配（import + 调用）
- [x] 函数 `checkMaestroCliAvailable` 使用 `execFile` 检测 `maestro` 命令（非空实现）

## Tests
- [x] `grep -n "maestroAvailable"` provider: 5 处匹配通过
- [x] `grep -n "checkMaestroCliAvailable"` provider: 2 处匹配通过

## Deviations
- None

## Notes
- 检测仅在启动时执行一次（非周期性），结果缓存到 `state.maestroAvailable`
- `checkMaestroCliAvailable` 是 exported 函数，可被外部调用者（如 main/index.ts）独立使用
- 遵循现有 graceful degradation 模式：CLI 不可用 -> 跳过 MCP handshake -> 使用静态 tool catalog
