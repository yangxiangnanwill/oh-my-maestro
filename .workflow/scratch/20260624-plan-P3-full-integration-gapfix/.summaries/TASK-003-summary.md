# TASK-003: 安装 @modelcontextprotocol/sdk + 确认 packages/mcp-v2 降级逻辑

## Changes
- `apps/desktop/package.json`: 新建文件，声明 @modelcontextprotocol/sdk (^1.0.0)、@trpc/server (^11.0.0)、@trpc/client (^11.0.0)、@trpc/react-query (^11.0.0)、zod (^3.22.0) 等依赖
- `apps/desktop/bun.lock`: bun install 自动生成的 lockfile
- `apps/desktop/src/main/lib/agent-setup/maestro-mcp-provider.ts`: 在 tryRegisterToSupersetRegistry() 的 catch 块中添加注释，明确说明 packages/mcp-v2/ 在独立 repo 中缺失是预期行为

## Verification
- [x] grep -c "@modelcontextprotocol/sdk" 在 package.json 中返回 >=1: 返回 1，依赖已声明
- [x] node_modules/@modelcontextprotocol/sdk 目录存在: bun install 成功安装 163 个包，包括 @modelcontextprotocol/sdk@1.29.0
- [x] grep -c "tryRegisterToSupersetRegistry" 返回 >=1: 返回 2（函数定义 + 调用处），降级逻辑已存在

## Tests
- [x] test -f package.json: PASS — package.json 存在
- [x] grep -c "@modelcontextprotocol/sdk" package.json: 返回 1

## Deviations
- None

## Notes
- bun install 成功安装了所有依赖（163 packages），包括 @modelcontextprotocol/sdk@1.29.0、@trpc/server@11.18.0、zod@3.25.76
- tryRegisterToSupersetRegistry() 的降级逻辑（try/catch）在任务执行前已正确实现，仅添加了注释说明 packages/mcp-v2 缺失是预期场景
- 下一个任务 TASK-004 需要检查 test-setup.ts 中 @modelcontextprotocol/sdk 的导入路径
