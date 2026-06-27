# Task: TASK-040 Wave 1: 入口适配 — index.html + index.tsx 合并 Superset 模式

## Implementation Summary

### Files Modified
- `apps/desktop/src/renderer/index.html`: 将 `<div id='root'>` 替换为 `<app></app>` 根元素；添加 CSP meta 标签；保留 `<title>Maestro IDE</title>`
- `apps/desktop/src/renderer/index.tsx`: 合并 Superset 启动模式 — boot-error-handling + persistent-hash-history + router context (queryClient) + BootErrorBoundary + globals.css 导入 + 路由注册 + deep-link IPC 处理

### Files Created
- `apps/desktop/src/renderer/lib/boot-errors.ts`: 启动错误处理模块（适配自 Superset，替换品牌为 Maestro）
- `apps/desktop/src/renderer/lib/persistent-hash-history/persistent-hash-history.ts`: 持久化 hash 历史记录实现
- `apps/desktop/src/renderer/components/BootErrorBoundary/BootErrorBoundary.tsx`: React Error Boundary 组件（适配自 Superset）
- `apps/desktop/src/renderer/lib/query-client.ts`: 共享 QueryClient 实例（用于 router context）
- `apps/desktop/src/renderer/routes/not-found.tsx`: 404 路由组件

### Files Preserved
- `apps/desktop/src/renderer/App.tsx`: Maestro 独有路由配置，保持不变

### Content Added
- **initBootErrorHandling()** (`lib/boot-errors.ts:80`): 注册全局 error/unhandledrejection 监听器，在 React 挂载前捕获启动错误
- **reportBootError()** (`lib/boot-errors.ts:64`): 在挂载前渲染错误信息到 DOM，挂载后仅 console.error
- **markBootMounted()** (`lib/boot-errors.ts:95`): 标记挂载完成，后续错误不再渲染错误界面
- **createPersistentHashHistory()** (`lib/persistent-hash-history/persistent-hash-history.ts:110`): 创建基于 localStorage 的 hash 历史持久化
- **BootErrorBoundary** (`components/BootErrorBoundary/BootErrorBoundary.tsx:14`): React class 组件错误边界，捕获渲染器启动时崩溃
- **queryClient** (`lib/query-client.ts:3`): 全局 QueryClient 实例，配置 networkMode: always + retry: false

## Outputs for Dependent Tasks

### Available Components
```typescript
import { initBootErrorHandling, reportBootError, markBootMounted, cleanupBootErrorHandling, isBootErrorReported } from 'renderer/lib/boot-errors';
import { persistentHistory, createPersistentHashHistory } from 'renderer/lib/persistent-hash-history/persistent-hash-history';
import { BootErrorBoundary } from 'renderer/components/BootErrorBoundary/BootErrorBoundary';
import { queryClient } from 'renderer/lib/query-client';
```

### Integration Points
- **Router context**: `createRouter({ context: { queryClient } })` 使 tRPC 在 router loaders 中可用
- **History**: `createRouter({ history: persistentHistory })` 启用 hash 路由持久化
- **Error handling**: `<BootErrorBoundary onError={reportBootError}>` 包裹 `<RouterProvider>`
- **Root element**: `document.querySelector("app")` 替代 `document.getElementById("root")`

## Status: Complete
