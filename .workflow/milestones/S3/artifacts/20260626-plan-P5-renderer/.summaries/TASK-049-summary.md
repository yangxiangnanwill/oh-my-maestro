# Task: TASK-049 Wave 4: react-query/ — presets + projects + workspaces

## Implementation Summary

从 Superset 源迁移 react-query/ 数据查询层到 oh-my-maestro，排除 GitHub 集成相关文件，替换所有 @superset 引用。

### Files Created (36 files)

**presets/ (1 file)**
- `presets/index.ts`: 终端预设 hooks（create/update/delete/reorder/setAutoApply + usePresets）

**projects/ (8 files)**
- `projects/index.ts`: 项目 hooks 导出索引（排除 GitHub 相关）
- `projects/useFinalizeProjectSetup/index.ts`: 导出 barrel
- `projects/useFinalizeProjectSetup/useFinalizeProjectSetup.ts`: 项目设置完成后副作用（sidebar + cache invalidation）
- `projects/useHostProjectIds/index.ts`: 导出 barrel
- `projects/useHostProjectIds/useHostProjectIds.ts`: 查询 host 上已有项目 ID 列表
- `projects/useOpenFromPath.ts`: 从路径打开项目 mutation
- `projects/useOpenNew.ts`: 打开新项目 mutation
- `projects/useReorderProjects.ts`: 项目排序 mutation
- `projects/useUpdateProject.ts`: 更新项目 mutation

**workspaces/ (27 files)**
- `workspaces/index.ts`: 工作区 hooks 导出索引
- `workspaces/bootstrap-open-worktree.ts`: 工作树打开引导逻辑
- `workspaces/bootstrap-open-worktree.test.ts`: bootstrap 测试（4 tests）
- `workspaces/deleteDialogOpenScheduler.test.ts`: 删除对话框调度器测试（3 tests）
- `workspaces/invalidateWorkspaceQueries.ts`: 工作区查询缓存失效工具
- `workspaces/useCloseWorkspace.ts`: 关闭工作区 mutation（乐观更新 + 导航）
- `workspaces/useCreateSectionFromWorkspaces.ts`: 从工作区创建分区
- `workspaces/useCreateWorkspace.ts`: 创建工作区 mutation（含 pending setup）
- `workspaces/useDeleteWorkspace.ts`: 删除工作区 mutation（乐观更新 + 导航）
- `workspaces/useDeleteWorktree.ts`: 删除工作树 mutation
- `workspaces/useHandleOpenedWorktree.ts`: 处理已打开工作树
- `workspaces/useImportAllWorktrees.ts`: 导入所有工作树
- `workspaces/useImportExternalWorktrees.ts`: 导入外部工作树
- `workspaces/useMoveWorkspacesToSection.ts`: 批量移动工作区到分区
- `workspaces/useMoveWorkspaceToSection.ts`: 移动单个工作区到分区
- `workspaces/useOpenExternalWorktree.ts`: 打开外部工作树
- `workspaces/useOpenMainRepoWorkspace.ts`: 打开主仓库工作区
- `workspaces/useOpenTrackedWorktree.ts`: 打开已跟踪工作树
- `workspaces/useReorderProjectChildren.ts`: 项目子项排序
- `workspaces/useReorderSections.ts`: 分区排序
- `workspaces/useReorderWorkspaces.ts`: 工作区排序
- `workspaces/useReorderWorkspacesInSection.ts`: 分区内工作区排序
- `workspaces/useUpdateWorkspace.ts`: 更新工作区 mutation
- `workspaces/useWorkspaceDeleteHandler.ts`: 删除/关闭对话框状态管理
- `workspaces/utils/workspace-removal.ts`: 工作区移除工具（含本地 getActiveIdAfterRemoval 实现）
- `workspaces/utils/workspace-removal.test.ts`: 工作区移除工具测试（2 tests）

### Files Excluded (GitHub 集成相关)
- `projects/InitGitDialog.tsx` — Git 初始化对话框
- `projects/processOpenNewResults.ts` — 仅被 useOpenProject 使用
- `projects/useCreateV1Project.ts` — GitHub clone repo
- `projects/useOpenProject.tsx` — 依赖 git-init-dialog store
- `workspaces/useCreateFromPr.ts` — GitHub PR 创建工作区

### @superset 引用替换
- `@superset/ui/sonner` -> `renderer/lib/toast`（5 files）
- `@superset/panes` -> 本地 `getActiveIdAfterRemoval` 实现（workspace-removal.ts）
- `@superset/shared/agent-launch` -> 文件已排除（useCreateFromPr.ts）

## Outputs for Dependent Tasks

### Available Components
```typescript
// Presets
import { usePresets } from "renderer/react-query/presets";

// Projects
import { useOpenNew, useOpenFromPath, useUpdateProject, useReorderProjects } from "renderer/react-query/projects";
import { useFinalizeProjectSetup } from "renderer/react-query/projects/useFinalizeProjectSetup";
import { useHostProjectIds, hostProjectListQueryKey } from "renderer/react-query/projects/useHostProjectIds";

// Workspaces
import { useCreateWorkspace, useCloseWorkspace, useDeleteWorkspace } from "renderer/react-query/workspaces";
import { useWorkspaceDeleteHandler } from "renderer/react-query/workspaces";
import { getWorkspaceFocusTargetAfterRemoval, removeWorkspaceFromGroups } from "renderer/react-query/workspaces/utils/workspace-removal";
```

### Integration Points
- **useCreateWorkspace**: 依赖 `renderer/stores/workspace-init`（需在 stores 迁移中创建）
- **useCloseWorkspace/useDeleteWorkspace**: 依赖 `renderer/routes/_authenticated/_dashboard/utils/workspace-navigation`（需在 routes 迁移中创建）
- **useHandleOpenedWorktree**: 依赖 `renderer/stores/tabs/store`（需在 stores 迁移中创建）
- **useFinalizeProjectSetup**: 依赖 `renderer/routes/_authenticated/hooks/useDashboardSidebarState`（需在 routes 迁移中创建）

### Dependency Status
- 27 个 typecheck 错误均为缺失依赖模块（stores/routes 尚未迁移），非结构性代码错误
- 9 个测试全部通过（3 test files, 22 assertions）

## Status: Complete
