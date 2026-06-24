# TASK-003: 分析面板 — 6 维评分 + 风险矩阵 UI

## Changes
- `apps/desktop/src/renderer/components/AnalysisPanel/types.ts`: 创建类型定义 — DimensionScore (name/score/confidence/evidence)、RiskItem (id/description/probability/impact/mitigation)、AnalysisResult (dimensions/risks/overallVerdict/overallConfidence/topic/timestamp/recommendations)、AnalysisPanelProps (cwd/topic/title)、mapAnalyzeResult() 后端数据映射函数
- `apps/desktop/src/renderer/components/AnalysisPanel/ScoreCard.tsx`: 创建维度评分卡 — Star 图标 1-5 填充/空心、置信度进度条 (div + width%)、ChevronDown/ChevronUp 切换展开 evidence 列表
- `apps/desktop/src/renderer/components/AnalysisPanel/RiskMatrix.tsx`: 创建 5x5 风险矩阵热力图 — X 轴概率/Y 轴影响标签、格子颜色按 count 映射 (0=gray, 1=green, 2=yellow, 3=orange, 4+=red)、可点击展开选中格子的风险项详情
- `apps/desktop/src/renderer/components/AnalysisPanel/AnalysisPanel.tsx`: 创建主组件 — OverallVerdict 横幅 (CheckCircle/AlertTriangle/ShieldAlert + 环形置信度 SVG)、四态渲染 (LoadingState/ErrorState/EmptyState/AnalysisView)、建议列表、6 个 ScoreCard 网格 + RiskMatrix
- `apps/desktop/src/renderer/components/AnalysisPanel/index.ts`: 创建模块导出 — AnalysisPanel + RiskMatrix + ScoreCard + mapAnalyzeResult + 所有类型

## Verification
- [x] AnalysisPanel.tsx 文件存在于 AnalysisPanel/ 目录中: 已确认 (5 个文件)
- [x] AnalysisPanel 使用 electronTrpc.maestro.analyze.result.useQuery 获取数据: 已确认 (AnalysisPanel.tsx:146)
- [x] ScoreCard 组件渲染 6 个维度评分，每个显示星级和置信度: 已确认 — Star 填充/空心图标 + confidence 进度条 + 可展开 evidence
- [x] RiskMatrix 组件渲染 5x5 网格，格子颜色根据风险项数量变化: 已确认 — cellColorClass 函数 5 级颜色映射
- [x] grep 'electronTrpc.maestro.analyze.result' 返回匹配: 1 处 (AnalysisPanel.tsx:146)

## Tests
- 测试命令未在当前 checkout 中运行（需完整 Superset monorepo + tRPC 上下文 + bun）
- 单元测试文件未创建（test.commands 中列出的 .test.tsx 文件依赖完整的 renderer test 基础设施）

## Deviations
- 未运行 `bun run build` 和 `bun run test`：当前 checkout 为 oh-my-maestro 仓库子集（仅 apps/desktop/），缺少 Superset monorepo 根目录的 bun 配置和依赖。构建/测试需在完整 Superset 仓库中执行。
- 单元测试文件（AnalysisPanel.test.tsx 等）未创建：测试基础设施依赖 Superset monorepo 的 test-utils 和 bun test 框架，且 TASK-003 未明确要求创建测试文件（test.unit 为可选列表）。
- 后端 schema 与 UI 映射：后端 dimensionScore.score 为 0-10，RiskItem 使用 severity/likelihood 枚举。通过 mapAnalyzeResult() 转换为 UI 映射层（星级 1-5、impact/probability 1-5）。

## Notes
- 后端 `riskEntrySchema.severity` 使用 `low/medium/high/critical` 4 级，`likelihood` 使用 `low/medium/high` 3 级。在 mapAnalyzeResult 中映射为 impact(1-5) 和 probability(1-5)。
- 整体判定 mapOverallVerdict: score >= 7 → GO, score >= 4 → CONDITIONAL_GO, 其余 → NO-GO。
- 组件遵循 CommandChainPanel 的四态渲染模式：LoadingState (Loader2 spin)、ErrorState (AlertTriangle + 消息)、EmptyState (BarChart3 + 提示)、AnalysisView (完整数据渲染)。
- 下一个任务 (TASK-004: 命令面板) 可能复用此组件的展开/折叠模式。
