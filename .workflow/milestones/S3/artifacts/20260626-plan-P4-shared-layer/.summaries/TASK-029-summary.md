# Task: TASK-029 DIRECT_COPY 路由组 4：文件和迁移

## Implementation Summary

### Files Modified
- `apps/desktop/src/lib/trpc/routers/filesystem/index.ts`: 从 Superset 复制完整文件系统路由实现，替换 @superset/workspace-fs/host import 为 main/lib/workspace-fs-host
- `apps/desktop/src/lib/trpc/routers/migration/index.ts`: 从 Superset 复制完整迁移路由实现，替换 @superset/local-db import 为 main/lib/local-db
- `apps/desktop/tsconfig.json`: 新增 @superset/workspace-fs/host 路径别名

### Files Created
- `apps/desktop/src/lib/trpc/routers/utils/index.ts`: 工具函数 barrel export 入口
- `apps/desktop/src/lib/trpc/routers/utils/git-hook-tolerance.ts`: Git post-checkout hook 容错工具
- `apps/desktop/src/lib/trpc/routers/utils/path-exists-cache.ts`: 路径存在缓存工具
- `apps/desktop/src/lib/trpc/routers/workspace-fs-service/index.ts`: 工作区文件系统服务路由
- `apps/desktop/src/main/lib/workspace-fs-host/index.ts`: workspace-fs/host stub 模块入口
- `apps/desktop/src/main/lib/workspace-fs-host/types.ts`: FsHostService 和 WorkspaceFsPathError 类型定义
- `apps/desktop/src/main/lib/workspace-fs-host/watcher-manager.ts`: FsWatcherManager stub 类
- `apps/desktop/src/main/lib/workspace-fs-host/fs-host-service.ts`: createFsHostService stub 工厂函数
- `apps/desktop/src/main/lib/workspace-fs-host/path-utils.ts`: toRelativePath 工具函数
- `apps/desktop/src/main/lib/workspace-fs-host/error-utils.ts`: toErrorMessage 工具函数
- `apps/desktop/src/main/lib/fs-watcher-manager.ts`: WatchPathEventBatch 类型定义

### Content Added
- **createFilesystemRouter()** (`filesystem/index.ts`): 文件系统 tRPC 路由，包含 listDirectory/readFile/getMetadata/writeFile/createDirectory/deletePath/movePath/copyPath/searchFiles/searchContent/watchPath 共 11 个过程
- **createMigrationRouter()** (`migration/index.ts`): 迁移 tRPC 路由，包含 readV1Projects/readV1Workspaces/readV1Worktrees 共 3 个查询
- **isPostCheckoutHookFailure()** (`utils/git-hook-tolerance.ts`): 检测 git post-checkout hook 失败
- **runWithPostCheckoutHookTolerance()** (`utils/git-hook-tolerance.ts`): 带 hook 容错的异步操作执行器
- **pathExistsCached()** (`utils/path-exists-cache.ts`): 带 TTL 缓存的路径存在检查
- **clearPathExistsCache()** (`utils/path-exists-cache.ts`): 清除路径存在缓存
- **getServiceForWorkspace()** (`workspace-fs-service/index.ts`): 按 workspaceId 获取 FsHostService 实例
- **getServiceForRootPath()** (`workspace-fs-service/index.ts`): 按 rootPath 获取/缓存 FsHostService 实例
- **resolveWorkspaceRootPath()** (`workspace-fs-service/index.ts`): 解析 workspace 根路径
- **toRegisteredWorktreeRelativePath()** (`workspace-fs-service/index.ts`): 将绝对路径转换为 worktree 相对路径

## Outputs for Dependent Tasks

### Available Components
```typescript
// 路由创建函数
import { createFilesystemRouter } from "./filesystem";
import { createMigrationRouter } from "./migration";

// 工具函数
import { pathExistsCached, clearPathExistsCache } from "./utils";
import { isPostCheckoutHookFailure, runWithPostCheckoutHookTolerance } from "./utils";

// 文件系统服务
import { getServiceForWorkspace, getServiceForRootPath, resolveWorkspaceRootPath, toRegisteredWorktreeRelativePath, toRelativePath } from "./workspace-fs-service";
```

### Integration Points
- **filesystem 路由**: 依赖 workspace-fs-service 的 getServiceForWorkspace，依赖 workspace-fs-host 的 toErrorMessage
- **migration 路由**: 依赖 main/lib/local-db 的 projects/workspaces/worktrees schema 和 localDb 实例
- **workspace-fs-service**: 依赖 workspaces/utils/db-helpers、workspaces/utils/shell-env、workspaces/utils/worktree（Wave 3 迁移）
- **workspace-fs-host stub**: 提供类型定义和 stub 实现，完整实现在后续 phase 完成

### Known Limitations
- workspace-fs-service 引用 workspaces/utils/* 内部路由，需等 Wave 3 workspaces 迁移后才能编译通过
- workspace-fs-host 模块为 stub 实现，createFsHostService 会抛出错误

## Status: Completed
