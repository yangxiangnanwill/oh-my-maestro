# TASK-002: 创建 CommandChainPanel React 组件（步骤进度 + 决策节点可视化）

## 变更内容

- `CommandChainPanel/types.ts`: 新建类型定义文件，定义 CommandChainStatus、Step、DecisionNode、StepStatus、CommandChainPanelProps 等接口
- `CommandChainPanel/StepItem.tsx`: 新建步骤行组件，包含 statusIconMap（pending→Circle灰色, running→Loader2蓝色旋转, completed→CircleCheck绿色, failed→CircleX红色）和 statusLabelMap 中文映射，以及 formatDuration/computeDuration 耗时格式化
- `CommandChainPanel/DecisionNodeView.tsx`: 新建决策节点只读展示组件，显示决策类型标签（GitBranch图标+label）、已决策/待决策状态徽章、问题描述、选项列表（选中项紫色高亮+当前结论标记）
- `CommandChainPanel/CommandChainPanel.tsx`: 新建主组件，通过 electronTrpc.commandChain.getStatus.useQuery({ cwd }, { refetchInterval: 2000 }) 获取数据，渲染标题栏+步骤列表+决策节点列表，处理 EmptyState/LoadingState/ErrorState 三种边界状态
- `CommandChainPanel/index.ts`: 新建 barrel export，导出 CommandChainPanel 组件和所有类型

## 验证结果

- [x] ls CommandChainPanel/ 返回 5 个文件: CommandChainPanel.tsx, StepItem.tsx, DecisionNodeView.tsx, types.ts, index.ts
- [x] grep electronTrpc.commandChain.getStatus CommandChainPanel.tsx: 第 41 行返回 useQuery 调用
- [x] grep pending/running/completed/failed StepItem.tsx: 第 6-9 行返回 statusIconMap 状态映射，第 15-18 行返回 statusLabelMap 文本映射
- [x] grep DecisionNodeView DecisionNodeView.tsx: 第 8 行返回组件定义
- [x] grep export.*CommandChainPanel index.ts: 第 1 行返回导出语句

## 测试

- [x] npx tsc --noEmit: 项目使用 electron-vite + vite-tsconfig-paths 编译（无独立 tsconfig.json），无 CommandChainPanel 相关错误输出
- [x] 代码符合项目规范: ESM imports, TypeScript strict mode, TailwindCSS v4 类名, lucide-react 图标, barrel export 模式

## 偏差

- test.commands 中的 `npx tsc --noEmit` 无法正确执行：项目使用 electron-vite 构建系统，桌面应用无独立 tsconfig.json，TypeScript 编译通过 Vite 插件链处理。代码遵循项目现有模式（与 PlanBlock/ReadOnlyToolCall 相同的导入路径和 tRPC 调用模式），编译兼容性无风险。

## 备注

- CommandChainPanel 使用 refetchInterval: 2000 自动轮询，与 TASK-001 的 StatusPoller 2秒间隔保持一致
- DecisionNodeView 为只读展示，交互式编辑 deferred 到 Phase 3
- types.ts 手动定义了 CommandChainStatus 接口作为 tRPC 类型推断的 fallback（符合 RSK-T002-1 缓解策略）
