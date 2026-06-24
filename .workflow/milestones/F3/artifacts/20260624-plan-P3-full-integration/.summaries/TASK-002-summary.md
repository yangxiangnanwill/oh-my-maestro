# TASK-002: 知识面板 — KG 搜索结果 React 可视化

## Changes
- `apps/desktop/src/renderer/components/KnowledgePanel/types.ts` (新建): 定义 KnowledgeSearchInput、KnowledgeEntity、KnowledgeEntityType、KnowledgeSearchResult、KnowledgePanelProps 类型
- `apps/desktop/src/renderer/components/KnowledgePanel/KnowledgeCard.tsx` (新建): 单个知识卡片组件，显示 entityName（font-semibold）、entityType 标签（Badge 组件，5 种颜色映射）、relevanceScore 进度条（绿/黄/灰三色）、matchedKeywords 高亮（<mark> 标签），点击展开显示 relatedNodes 列表
- `apps/desktop/src/renderer/components/KnowledgePanel/KnowledgePanel.tsx` (新建): 主组件，包含搜索输入框（Search 图标 + X 清除按钮 + 300ms debounce）+ 四态渲染：LoadingState（Loader2 spin）、ErrorState（AlertTriangle + 重试按钮）、EmptyState（Search 图标 + 引导文字）、NoResultsState（无结果提示）、DataView（KnowledgeCard 列表 + 结果计数）。使用 electronTrpc.maestro.knowledge.search.useQuery 获取数据，通过 toKnowledgeEntity() 将后端 KgSearchResult 映射为前端 KnowledgeEntity
- `apps/desktop/src/renderer/components/KnowledgePanel/index.ts` (新建): 导出 KnowledgePanel、KnowledgeCard 组件和所有类型

## Verification
- [x] KnowledgePanel.tsx 文件存在于 KnowledgePanel/ 目录中: 已确认
- [x] KnowledgePanel 使用 electronTrpc.maestro.knowledge.search.useQuery 获取数据: 第 138 行
- [x] KnowledgePanel 实现四态渲染：isLoading → LoadingState, error → ErrorState, empty → EmptyState, data → KnowledgeCardList: 第 193-224 行，包含 LoadingState、ErrorState（含重试）、EmptyState、NoResultsState、ResultsView 五个分支
- [x] KnowledgeCard 组件显示 entityName 和 relevanceScore 字段: entity.name 第 99 行，entity.relevanceScore 第 139-144 行
- [x] grep -r 'electronTrpc.maestro.knowledge.search' KnowledgePanel/ 返回至少 1 处匹配: 1 处匹配（KnowledgePanel.tsx 第 138 行）

## Tests
- 测试命令 `bun run build` 和 `bun run test -- --grep 'KnowledgePanel'` 需要完整 Superset monorepo 环境（含 `bun` 运行时、`@trpc/react-query` 依赖），当前工作空间为部分检出，无法执行。代码已通过：
  - 导入路径遵循现有 CommandChainPanel 的 `from "renderer/lib/electron-trpc"` 模式
  - 四态渲染 CSS 类名与 CommandChainPanel 保持一致（`flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground` 等）
  - Lucide 图标使用与现有组件一致（Loader2、AlertTriangle、Search、X、ChevronDown、ChevronUp、ExternalLink、Tag）

## Deviations
- **类型映射层**: 后端 tRPC `kgSearchResultSchema` 返回的字段（title、score、type: spec|knowhow|wiki|code|artifact）与 UI 类型 KnowledgeEntity（name、relevanceScore、type: command|skill|spec|knowhow|issue）不一致。在 KnowledgePanel.tsx 中添加了 `toKnowledgeEntity()` 映射函数和 `mapType()` 类型转换函数来处理此差异。
- **额外状态**: 在四态之外增加了 NoResultsState（搜索有结果但为空），与 EmptyState（未输入搜索词）区分，提供更好的 UX。
- **electron-trpc.ts 不存在**: `renderer/lib/electron-trpc.ts` 在当前工作空间中不存在（被 CommandChainPanel.tsx 引用但未检出）。KnowledgePanel 使用相同的导入路径，依赖完整 Superset monorepo 中的 tRPC 基础设施。

## Notes
- KnowledgeCard 的展开/收起使用 useState 管理，每个卡片独立状态
- 搜索使用 300ms debounce，通过 useEffect + setTimeout 实现
- tRPC query 仅在 debouncedQuery 非空时启用（`{ enabled }` 选项），避免无效请求
- 后端结果到前端实体的映射在 useMemo 中完成，避免不必要的重计算
- 后续任务如需添加虚拟列表（处理大量结果），可在 KnowledgeCardList 外层包裹虚拟滚动容器
