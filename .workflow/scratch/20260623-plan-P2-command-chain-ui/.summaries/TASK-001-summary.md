# TASK-001: 创建 status.json 文件轮询 tRPC 服务

## Changes
- `apps/desktop/src/main/lib/command-chain-status-poller.ts`: 新建 CommandChainStatusPoller 类，包含 start/stop/getStatus 方法，使用 setInterval 每 2s 轮询 status.json，通过 fs.readFileSync 读取并 JSON.parse 解析，含完整类型校验
- `apps/desktop/src/lib/trpc/routers/command-chain/index.ts`: 新建 createCommandChainRouter()，暴露 commandChain.getStatus publicProcedure.query，使用 zod schema 定义 status.json 结构验证
- `apps/desktop/src/lib/trpc/routers/index.ts`: 注册 commandChain router 到 AppRouter

## Verification
- [x] grep 'commandChain' routers/index.ts: 第 38 行返回 commandChain router 注册行
- [x] grep 'CommandChainStatusPoller' command-chain-status-poller.ts: 第 35/40 行返回类定义行
- [x] grep 'setInterval' command-chain-status-poller.ts: 第 41/53 行返回 2 处（定时器声明 + 调用）
- [x] grep 'getStatus' command-chain/index.ts: 第 48/58 行返回 query 定义行
- [x] cat command-chain-status-poller.ts 包含 'fs.readFileSync': 第 1 行导入 + 第 86 行使用

## Tests
- [x] TypeScript 编译检查: 无 command-chain 相关错误

## Deviations
- 无

## Notes
- StatusPoller 实例在 router 模块顶层创建（单例），首次调用 getStatus query 时自动启动轮询
- status.json 不存在或解析失败时 getStatus() 返回 null，不抛异常
- 后续任务可基于此 router 创建 renderer 侧 React hook
