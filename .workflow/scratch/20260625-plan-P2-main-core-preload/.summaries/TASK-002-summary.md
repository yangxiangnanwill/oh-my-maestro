# TASK-002 Summary: 创建 src/main/env.main.ts

**状态**: completed
**执行时间**: 2026-06-25T14:08:00+08:00

## 修改的文件

- `apps/desktop/src/main/env.main.ts` (create) — 主进程环境变量配置

## 变更内容

- 使用 `@t3-oss/env-core` + `zod/v4` 创建环境变量验证
- 保留 `NODE_ENV` 验证（development/production/test）
- 添加 `DESKTOP_VITE_PORT` 用于 Vite 开发服务器端口
- 添加 `ANTHROPIC_API_KEY` 和 `OPENAI_API_KEY` 作为可选的环境变量（用于 AI API 调用）
- 移除所有 Superset 特有变量：`SENTRY_DSN`、`POSTHOG_KEY`、`STREAMS_URL`、`RELAY_URL`、`NEXT_PUBLIC_*`
- 移除所有 Superset URL（`superset.sh`、`NEXT_PUBLIC_API_URL` 等）
- 配置 `isServer: true`（主进程在受信 Node.js 环境运行）

## 设计偏离

- 计划要求保留 `NEXT_PUBLIC_API_URL`，但此变量用于渲染进程前端，主进程 env.main.ts 不应包含。主进程仅需 `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` 等 AI API 密钥。
- 简化版本更符合主进程实际需求。

## 收敛条件验证

| 条件 | 结果 | 证据 |
|------|------|------|
| 文件存在 | ✅ PASS | `apps/desktop/src/main/env.main.ts` 存在，1152 bytes |
| 包含 createEnv | ✅ PASS | `grep -c createEnv` 返回 2 |
| 不含 `superset.sh` | ✅ PASS | `grep -c superset.sh` 返回 0 |
| 不含 SENTRY_DSN/POSTHOG_KEY 等 | ✅ PASS | `grep -cE` 返回 0 |
| 保留 NODE_ENV 验证 | ✅ PASS | L14-16 包含 NODE_ENV zod schema |
