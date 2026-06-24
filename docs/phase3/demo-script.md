# Phase 3 全功能融合 — 端到端演示脚本

> **版本**: v1.0
> **最后更新**: 2026-06-24
> **目标**: 验证完整用户旅程 — 自然语言需求到命令链执行的闭环

---

## 前置条件检查清单

在开始演示之前，请确认以下条件满足：

- [ ] Superset Desktop 应用成功启动（`bun run dev:desktop`）
- [ ] Maestro-flow CLI 可正常执行（终端面板输入 `maestro --version` 有输出）
- [ ] MCP provider 注册成功（主进程日志显示 "Maestro MCP provider registered with N tools"）
- [ ] tRPC 端点可用（DevTools 中调用 `maestro.commands.list` 返回非空列表）
- [ ] 当前工作目录为 Superset 项目根目录

---

## 步骤 1: KG 搜索 — 知识面板验证

### 操作

1. 打开 Superset Desktop 应用
2. 在左侧侧边栏中找到 **知识面板**（KnowledgePanel）标签页
3. 在搜索输入框中输入关键词：`topology layout`
4. 等待搜索结果加载（约 300ms debounce + 网络延迟）

### 预期结果

- [x] 搜索输入框左侧有 Search 图标
- [x] 输入文字后右侧出现 X 清除按钮
- [x] 加载中显示 LoadingState（Loader2 旋转动画 + "搜索中..." 文字）
- [x] 搜索结果展示为 KnowledgeCard 列表
  - 每张卡片显示：实体名称（font-semibold）、类型标签（Badge，按类型着色）、相关度分数（进度条，绿/黄/灰三色）
  - 匹配关键词用 `<mark>` 高亮
- [x] 结果区域顶部显示 "共 N 条结果"
- [x] 点击 KnowledgeCard 可展开详情：显示 relatedNodes 列表和 matchedKeywords
- [x] 无结果时显示 NoResultsState: "未找到与 \"xxx\" 相关的结果"
- [x] 空输入时显示 EmptyState: "输入关键词搜索知识图谱"

### 验证要点

| 验证项 | 方法 | 通过标准 |
|--------|------|----------|
| tRPC 数据流 | DevTools Network 面板检查 `maestro.knowledge.search` 请求 | 返回结构化 `KgSearchResult[]` |
| Debounce 行为 | 快速连续输入 5 个字符 | 只触发 1 次请求（300ms 后） |
| 错误处理 | 断开 MCP 连接后搜索 | 显示 ErrorState + 重试按钮 |
| 数据映射 | 检查 KnowledgeCard 中的类型标签颜色 | spec=blue, knowhow=purple, issue=orange 等 |

---

## 步骤 2: 分析结果 — 分析面板验证

### 操作

1. 在终端面板（或已有的 Maestro session）中执行：`maestro analyze "Phase 3 integration"`
   - 或通过 CommandPalette (Ctrl+K) 搜索 `analyze` 并触发
2. 切换到 **分析面板**（AnalysisPanel）标签页

### 预期结果

- [x] 加载中显示 LoadingState（Loader2 + "加载中..."）
- [x] 分析数据到达后渲染：
  - **OverallVerdict 横幅**：GO/CONDITIONAL_GO/NO-GO 判定
    - GO → 绿色横幅 + CheckCircle 图标 + "GO — 建议推进"
    - CONDITIONAL_GO → 黄色横幅 + AlertTriangle 图标 + "CONDITIONAL GO — 条件满足后可推进"
    - NO-GO → 红色横幅 + ShieldAlert 图标 + "NO-GO — 不建议推进"
    - 右侧显示环形置信度指示器（SVG circle + 百分比数字）
  - **建议列表**（recommendations）：列表形式显示
  - **6 维评分卡网格**（ScoreCard）：
    - 2 列网格布局（sm 断点）
    - 每个卡片：维度名称 + 1-5 星级（Star 填充/空心） + 置信度进度条
    - 点击展开 evidence 列表
  - **风险矩阵**（RiskMatrix）：5x5 热力图
    - X 轴：概率（probability 1-5）
    - Y 轴：影响（impact 1-5）
    - 格子颜色：0=gray, 1=green, 2=yellow, 3=orange, 4+=red
    - 点击格子展开风险项详情

### 验证要点

| 验证项 | 方法 | 通过标准 |
|--------|------|----------|
| 星级映射 | 检查一个维度评分 `score: 8` | 渲染 4 个实心星 + 1 个空心星 |
| 判定映射 | `overallScore: 7.5` | 显示 "GO" |
| 风险矩阵颜色 | 检查风险最多的格子 | 颜色为 red（红色） |
| 错误处理 | 输入无效 topic | 显示 ErrorState |

---

## 步骤 3: 命令面板 — CommandPalette 搜索和触发

### 操作

1. 按下快捷键 `Ctrl+K`（或通过菜单打开命令面板）
2. 模态面板弹出，搜索输入框自动聚焦
3. 输入搜索关键词：`delegate`
4. 使用方向键 ↑↓ 导航到 `maestro delegate` 命令
5. 按 Enter 选中

### 预期结果

- [x] 模态面板以半透明背景覆盖整个窗口
- [x] 搜索输入框自动聚焦，左侧有 Search 图标
- [x] 命令列表按 category 分组显示：
  - 知识（knowledge）、分析（analysis）、命令（command）、工具（utility）
  - 每个分组有 sticky 标题，显示分组名 + 命令计数
- [x] 实时过滤：输入 `delegate` 后只显示匹配的命令
- [x] 键盘导航：
  - ArrowDown/ArrowUp 移动高亮项
  - 高亮项有 `bg-accent` 背景色 + `aria-selected="true"`
  - Enter 选中并执行
  - Escape 关闭面板
- [x] 选中命令后构建 CLI 字符串并 console.log
- [x] 底部状态栏显示：过滤计数 + 快捷键提示
- [x] 无匹配时显示 EmptyState: "无匹配的命令"

### 验证要点

| 验证项 | 方法 | 通过标准 |
|--------|------|----------|
| 分组顺序 | 检查分组排列 | knowledge → analysis → command → utility |
| 分类 Badge | 检查不同分类的命令 Badge 颜色 | knowledge=blue, analysis=purple, command=emerald, utility=amber |
| 搜索范围 | 输入 `search` | 匹配 name、description、category 中包含 "search" 的命令 |
| 命令数量 | 检查底部计数 | "显示 X/29 个命令" |

---

## 步骤 4: 决策联动 — Ralph 决策节点验证

### 操作

1. 执行一个会触发 Ralph 决策的流程：`maestro ralph next --auto-decision=false`
2. 观察 **命令链面板**（CommandChainPanel）中的决策节点区域
3. 当决策节点出现时，选择某个选项

### 预期结果

- [x] 命令链面板显示步骤进度（StepItem 列表）
  - 每个步骤显示状态（pending / running / completed / failed）
- [x] 决策节点区域显示 "决策节点" 标题
- [x] DecisionNodeView 渲染决策节点：
  - 节点标签（label）
  - 决策问题（question）
  - 可选项列表（options）
- [x] 选择选项后节点状态更新
- [x] 所有步骤完成后显示 "所有步骤已确认完成"（绿色背景）
- [x] 主进程日志显示决策桥接事件：
  - `decision-node-created` → `onDecisionRequired`
  - `decision-node-resolved` → `onDecisionResolved`

### 验证要点

| 验证项 | 方法 | 通过标准 |
|--------|------|----------|
| 文件轮询降级 | 停止 WebSocket 服务 | 自动切换到 `decision-events.json` 文件轮询 |
| 去重逻辑 | 重复触发相同决策节点 | 只触发一次 `onDecisionRequired` |
| 过期处理 | 等待决策节点过期 | 触发 `onDecisionExpired` |

---

## 步骤 5: 完整闭环 — 端到端最终验证

### 操作

完整执行以下端到端流程（约 5 分钟）：

```
1. 在终端中执行：maestro plan "创建一个 React 组件"
2. 观察 CommandChainPanel → 步骤进度逐条出现
3. 在 KnowledgePanel 中搜索相关关键词
   → 查看 KG 搜索结果
4. 在 AnalysisPanel 中查看分析结果
   → 验证 6 维评分和风险矩阵
5. 使用 CommandPalette (Ctrl+K) 搜索可用命令
6. 当 Ralph 决策节点出现时
   → 在 CommandChainPanel 中确认决策
7. 等待命令链执行完成
   → CommandChainPanel 显示 "所有步骤已确认完成"
```

### 预期结果

- [x] **步骤 1**：终端面板输出 `maestro plan` 的执行结果
- [x] **步骤 2**：CommandChainPanel 显示步骤进度（Step 1/N → Step N/N）
- [x] **步骤 3**：KnowledgePanel 搜索正常返回结果
- [x] **步骤 4**：AnalysisPanel 显示 6 维评分 + 风险矩阵 + OverallVerdict
- [x] **步骤 5**：CommandPalette 打开并过滤命令列表
- [x] **步骤 6**：DecisionNodeView 显示决策节点，选择选项后状态同步
- [x] **步骤 7**：CommandChainPanel 显示完成状态

### 完整闭环验证矩阵

```
┌─────────────────────────────────────────────────────────────────────┐
│ 起点                   中间状态                    终点               │
├─────────────────────────────────────────────────────────────────────┤
│ NL 需求 ──────────→ 命令链执行 ──────────→ 完成状态                  │
│ (maestro plan)       (CommandChainPanel)     ("所有步骤已确认完成")  │
│                                                                     │
│         ┌──────────→ KG 搜索 ──────────→ 知识卡片展示               │
│         │            (KnowledgePanel)      (KnowledgeCard[])         │
│         │                                                           │
│         ├──────────→ 分析 ──────────────→ 6维评分 + 风险矩阵         │
│         │            (AnalysisPanel)       (ScoreCard + RiskMatrix)  │
│         │                                                           │
│         ├──────────→ 命令发现 ──────────→ 命令触发                   │
│         │            (CommandPalette)      (CLI 执行)                │
│         │                                                           │
│         └──────────→ 决策 ──────────────→ Agent hooks 通知           │
│                      (DecisionNodeView)    (onDecisionRequired)      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 失败处理指南

如果在演示中遇到问题，按以下顺序排查：

### 知识面板

1. 检查 MCP provider 注册日志：主进程日志中是否有 "Maestro MCP provider registered"
2. 检查 `maestro search` CLI 是否可独立执行：在终端面板中运行 `maestro search "test"`
3. 检查 tRPC 请求：DevTools Network 面板中 `knowledge.search` 的返回内容

### 分析面板

1. 确认 `maestro analyze <topic> --json` 可正常执行并返回 JSON
2. 检查 `parseAnalyzeOutput` 是否正确解析 JSON 输出
3. 验证 `mapAnalyzeResult` 的 score → 星级映射（0-10 → 1-5）

### 命令面板

1. 确认 `getMaestroToolCatalog()` 返回非空工具列表
2. 检查 `CATEGORY_LABELS` 是否包含所有 4 个分类的中文名称
3. 验证 `handleSelect` 构建的 CLI 命令字符串格式正确

### 决策联动

1. 确认 WebSocket 端口 51742 没有被占用
2. 检查主进程日志中的决策桥接事件
3. 如果 WebSocket 不可用，验证文件轮询降级是否工作

---

## 性能基准

| 指标 | 目标值 | 备注 |
|------|--------|------|
| KG 搜索响应时间 | < 2s | 含 300ms debounce + MCP RTT |
| 分析结果加载 | < 5s | maestro analyze 执行时间 |
| 命令面板打开 | < 200ms | 首次打开含 tRPC 请求 |
| 命令搜索过滤 | < 50ms | 本地过滤，无网络请求 |
| 决策节点推送延迟 | < 1s | WebSocket 事件延迟 |
| 完整闭环总耗时 | < 5min | 含所有步骤手动操作 |

---

## 截图记录清单

完成演示后，请将以下截图放入 `docs/phase3/screenshots/` 目录：

- [ ] `step1-kg-search-results.png` — KnowledgePanel 显示搜索结果
- [ ] `step1-kg-search-empty.png` — KnowledgePanel 空状态
- [ ] `step1-kg-search-error.png` — KnowledgePanel 错误状态
- [ ] `step2-analysis-go.png` — AnalysisPanel GO 判定
- [ ] `step2-analysis-conditional.png` — AnalysisPanel CONDITIONAL_GO 判定
- [ ] `step2-analysis-nogo.png` — AnalysisPanel NO-GO 判定
- [ ] `step2-scorecard-expanded.png` — ScoreCard 展开 evidence
- [ ] `step2-risk-matrix.png` — RiskMatrix 热力图
- [ ] `step3-command-palette-open.png` — CommandPalette 打开
- [ ] `step3-command-palette-filter.png` — CommandPalette 过滤
- [ ] `step4-decision-node.png` — DecisionNodeView 渲染决策节点
- [ ] `step4-all-completed.png` — "所有步骤已确认完成" 状态
- [ ] `step5-full-flow-start.png` — 完整闭环开始
- [ ] `step5-full-flow-end.png` — 完整闭环完成
