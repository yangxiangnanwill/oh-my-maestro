# Context: S3 Phase 5 — src/renderer 前端迁移

**Date**: 2026-06-26
**Scope**: S3 Phase 5 — 补充 assets、components、hooks、providers、routes 等前端模块
**Mode**: Quick（范围明确，跳过探索直接决策提取）
**scope_verdict**: large（3+ 独立子系统，需串行依赖屏障）

---

## 当前状态

oh-my-maestro `apps/desktop/src/renderer/` 已有：
- `components/AnalysisPanel/` — Maestro 独有（保留）
- `components/CommandChainPanel/` — Maestro 独有（保留）
- `components/CommandPalette/` — Maestro 独有（保留）
- `components/KnowledgePanel/` — Maestro 独有（保留）
- `contexts/` — 3 个 context
- `lib/` — 1 个文件
- `routes/` — 3 个路由文件
- `App.tsx`、`index.tsx`、`index.html`、`routeTree.gen.ts`

Superset 源 `apps/desktop/src/renderer/` 包含：
- `assets/` — 3 个（品牌图标等）
- `components/` — 25 个组件目录
- `hooks/` — 21 个 hooks
- `hotkeys/` — 10 个快捷键定义
- `lib/` — 42 个工具库文件
- `providers/` — 3 个 Provider
- `react-query/` — 3 个
- `routes/` — 3 个路由
- `commandPalette/` — 5 个命令面板文件
- `globals.css`、`env.d.ts`、`env.renderer.ts`

**oh-my-maestro 缺失**: assets、hooks、hotkeys、providers、react-query、globals.css、env.d.ts、env.renderer.ts、20+ 组件

---

## 差异分析

### DIRECT_COPY（直接复制，与品牌无关）

| 模块 | 文件数 | 说明 |
|------|--------|------|
| assets/ | 3 | 替换品牌图标 |
| globals.css | 1 | 全局样式 |
| env.d.ts + env.renderer.ts | 2 | 环境类型和变量 |
| hooks/ (通用) | ~15 | 通用 React hooks |
| hotkeys/ | 10 | 快捷键定义 |
| lib/ (工具类) | ~35 | 文件图标、格式化、性能、持久化历史等 |
| react-query/ | 3 | React Query 配置 |
| providers/ (通用) | 2 | 通用 Provider |
| components/ (通用) | ~15 | BootErrorBoundary、ColorSelector、MarkdownEditor、icons 等 |

### ADAPT（需要适配替换）

| 模块 | 文件数 | 适配内容 |
|------|--------|----------|
| components/ (业务) | ~10 | AgentSelect、Chat、NewWorkspaceModal 等 |
| hooks/ (业务) | ~6 | useAgentChoices、useChat 等 |
| lib/ (业务) | ~7 | analytics、terminal 相关 |
| routes/ | 3 | 替换 Superset 路由逻辑 |
| providers/ (业务) | 1 | 排除 PostHogProvider |
| commandPalette/ | 5 | 适配 Maestro 命令 |

### KEEP（oh-my-maestro 独有，保留不动）

| 模块 | 说明 |
|------|------|
| AnalysisPanel | Maestro 分析面板 |
| CommandChainPanel | Maestro 命令链面板 |
| CommandPalette | Maestro 命令面板 |
| KnowledgePanel | Maestro 知识面板 |
| contexts/ | Maestro 独有 context |
| App.tsx | Maestro 路由配置 |
| routeTree.gen.ts | 自动生成的路由树 |

### EXCLUDE（排除，不迁移）

| 模块 | 原因 |
|------|------|
| PostHogProvider | 分析追踪 |
| Paywall 组件 | 计费相关 |
| V2 相关组件/hooks | Superset V2 特有 |
| Relay 相关 | Superset Relay 集成 |
| Stripe 相关 | 计费 |

---

## Decisions

### Decision 1: 迁移策略

- **Chosen**: 分 6 Wave 渐进迁移
- **Reason**: 依赖关系：入口层 → 工具层 → 交互层 → 数据层 → 组件层 → 路由层

### Decision 2: 组件迁移优先级

- **Chosen**: 先迁移通用组件（无 @superset 引用），再适配业务组件
- **Reason**: 通用组件是业务组件的依赖

### Decision 3: Maestro 独有组件整合

- **Chosen**: 保留所有 4 个 Maestro 独有组件，在路由中与 Superset 组件共存
- **Reason**: 这些是 Maestro 的核心差异化功能

---

## Constraints

### Locked

1. **Maestro 独有组件必须保留**: AnalysisPanel、CommandChainPanel、CommandPalette、KnowledgePanel
2. **排除 PostHog/Paywall/V2/Relay/Stripe**: 不迁移
3. **保持现有路由结构**: App.tsx 和 routeTree.gen.ts 不动
4. **CSS 使用 TailwindCSS + shadcn/ui**: 与现有技术栈一致

### Free

1. 组件目录结构（保持 Superset 风格 vs 扁平化）
2. 部分 hooks 是否用 Maestro 独有实现替代
3. globals.css 合并策略

### Deferred

1. 完整 UI 品牌统一 → Phase 5 后独立 polish
2. Maestro 独有主题系统 → 独立 Phase

---

## Wave 执行计划

### Wave 1: 入口层
- assets/、globals.css、index.html、index.tsx、env.d.ts、env.renderer.ts

### Wave 2: 工具层
- lib/ DIRECT_COPY（~35 文件）：fileIcons、formatPath、performance、persistent-hash-history、tiptap、terminal 等

### Wave 3: 交互层
- hotkeys/（10 文件）+ hooks/ 通用部分（~15 文件）

### Wave 4: 数据层
- providers/（2 通用）+ react-query/（3 文件）

### Wave 5: 组件层
- components/ DIRECT_COPY（~15 通用组件）+ ADAPT（~10 业务组件）

### Wave 6: 路由层
- routes/ + commandPalette/ 选择性合并 + 编译验证
