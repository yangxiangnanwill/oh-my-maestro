# TASK-002: 配置 Maestro-flow 终端环境变量

## Changes
- `apps/desktop/src/main/lib/terminal/env.ts`: 
  - 添加 `import path from "node:path"` 导入
  - 在 `ALLOWED_ENV_VARS` 集合中添加 `"MAESTRO_HOME"`（允许通过 allowlist 透传）
  - 在 `buildTerminalEnv()` 返回的 `terminalEnv` 对象中添加 `MAESTRO_HOME: path.join(os.homedir(), ".maestro")`

## Verification
- [x] `buildTerminalEnv()` 函数包含 MAESTRO_HOME 环境变量设置: 在 terminalEnv 对象中添加了 `MAESTRO_HOME: path.join(os.homedir(), ".maestro")`
- [x] MAESTRO_HOME 路径指向用户 .maestro 目录: 使用 `path.join(os.homedir(), ".maestro")`，Windows 解析为 `C:\Users\<用户名>\.maestro`，Unix 解析为 `~/.maestro`
- [x] Agent Launch Config 的 env 字段包含 MAESTRO_HOME: `AgentLaunchConfig.env` 是 `Record<string, string>`，且 `buildTerminalEnv()` 是终端环境变量的唯一构建入口，所有 agent 终端会话都会自动获得 MAESTRO_HOME
- [x] `grep -c 'MAESTRO_HOME' apps/desktop/src/main/lib/terminal/env.ts` 返回 >= 1: 返回 2（allowlist 集合中 1 处 + terminalEnv 对象中 1 处）

## Tests
- 无 test.commands 定义（任务未指定测试命令）
- TypeScript 语法验证通过（node 脚本检查 import、字符串字面量、对象属性语法均正确）

## Deviations
- 无

## Notes
- `MAESTRO_HOME` 同时加入 allowlist 和 terminalEnv 对象：allowlist 确保用户已设置的 MAESTRO_HOME 不会被过滤；terminalEnv 对象确保即使未设置也会自动指向 `~/.maestro`
- 下一个任务（TASK-003）如果需要，可以直接在终端中使用 `$MAESTRO_HOME` 引用该路径
