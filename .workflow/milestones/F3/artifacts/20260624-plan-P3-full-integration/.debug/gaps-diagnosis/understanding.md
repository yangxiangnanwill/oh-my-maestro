# Debug: F3 Phase 3 Full Integration Verification Gaps

## Status
diagnosed — 8/8 gaps 根因已确认

## Issue
F3 Phase 3 (full-integration) 执行完成，VRF-004 验证发现 8 个 gaps（1 个 antipattern 除外），分为 4 个聚类。所有 gaps 经代码级证据确认——均为真实缺失，非验证误报。

---

## Symptoms → Diagnosis Map

### 聚类 1: tRPC 基础设施缺失 (GAP-001, GAP-002) — **CRITICAL**

| Gap | Root Cause | Affected Files | Fix Direction |
|-----|-----------|----------------|---------------|
| **GAP-001** | `electron-trpc.ts` 从未创建。4 个 UI 面板均引用 `renderer/lib/electron-trpc` 导入 `electronTrpc`，但该文件不存在 | 新建 `renderer/lib/electron-trpc.ts` | 创建 tRPC React client，为 `maestro`/`commandChain` router 提供 typed hooks（基于 `@trpc/client` + `createTRPCReact`） |
| **GAP-002** | `lib/trpc/index.ts` 从未创建。`routers/index.ts` 和 `routers/maestro/index.ts`、`routers/command-chain/index.ts` 均从 `..` 或 `../..` 导入 `router`/`publicProcedure`，但项目中无任何文件定义这些导出 | 新建 `lib/trpc/index.ts` | 创建 tRPC 初始化文件，导出 `router` 和 `publicProcedure`（使用 `@trpc/server` 的 `initTRPC`） |

**影响范围**: 所有 UI 面板（KnowledgePanel, AnalysisPanel, CommandPalette, CommandChainPanel）无法获取数据——这是 **阻断级别的缺陷**。

### 聚类 2: 外部依赖 (GAP-003, GAP-004, GAP-005) — **HIGH/MEDIUM**

| Gap | Root Cause | Affected Files | Fix Direction |
|-----|-----------|----------------|---------------|
| **GAP-003** | `@modelcontextprotocol/sdk` 未在项目中安装 | `maestro-mcp-provider.ts` | `bun add @modelcontextprotocol/sdk` 并确认版本兼容 |
| **GAP-004** | `packages/mcp-v2/` 目录不存在。本项目 (`oh-my-maestro`) 是独立 repo，非 Superset monorepo 的子包 | `maestro-mcp-provider.ts` 中的 `ToolRegistry` 引用 | 有两种策略: (a) 将 mcp-v2 的 `ToolRegistry` 接口本地实现 (b) 通过 git submodule 或 npm link 引入 maestro CLI 项目 |
| **GAP-005** | maestro CLI 路径无预检 | 需要新增到 `paths.ts` 或 `utils.ts` | 添加 `which maestro` / `find-maestro-cli.ts` 运行时检测，支持配置 fallback 路径 |

### 聚类 3: 功能集成 (GAP-006, GAP-008) — **MEDIUM**

| Gap | Root Cause | Affected Files | Fix Direction |
|-----|-----------|----------------|---------------|
| **GAP-006** | `CommandPalette.tsx:214` 终端执行被标记为 `TODO: Wave 3`——这是有意的 Phase 规划延迟，但在 F3 验证中被标记为 gap | `CommandPalette.tsx:206-220` | 接入 Agent Launch API 或终端 session：`window.electronAPI?.terminalWrite(cliLine)` |
| **GAP-008** | `DecisionNodeView.tsx` 仅作展示——标签、问题文本、只读选项列表、`当前结论`标记。无 `onClick`/`onSelect`/`button`/`onDecision` 等交互元素 | `DecisionNodeView.tsx:8-60` | 为待决策节点添加可点击选项按钮；通过 `onDecision(option)` callback 通知父组件 |

### 聚类 4: UX 完善 (GAP-007) — **LOW**

| Gap | Root Cause | Affected Files | Fix Direction |
|-----|-----------|----------------|---------------|
| **GAP-007** | `AnalysisPanel.tsx:41-48` `ErrorState` 组件仅有错误展示（图标 + 消息），缺少重试机制 | `AnalysisPanel.tsx:41-48, 140-150` | 添加 `onRetry` prop 到 `ErrorState`，通过 `useQuery` 的 `refetch` 实现重试 |

---

## Root Cause Summary

**根本原因: F3 执行聚焦于 6 个 TASK 的代码产出，但 2 个关键基础设施文件 (`electron-trpc.ts` 和 `lib/trpc/index.ts`) 在 TASK 分解中被遗漏。** 这两个文件是所有 UI 面板与后端通信的必经通道——没有它们，所有 UI 组件都处于"有线无电"状态。

次要原因:
- 外部依赖 (`@modelcontextprotocol/sdk`, `packages/mcp-v2/`) 未被纳入 TASK 依赖检查
- 功能集成被标记为 `TODO: Wave 3` 说明 F3 scope 定义与实际 deliverable 有偏差
- UX 完善项属于 polish 层面的遗漏

---

## Fix Plan

### Wave 1: 打通数据通道（消除 CRITICAL blockers）
1. 创建 `lib/trpc/index.ts` — 初始化 tRPC server context
2. 创建 `renderer/lib/electron-trpc.ts` — tRPC React client

### Wave 2: 安装外部依赖
3. `bun add @modelcontextprotocol/sdk`
4. 解决 `packages/mcp-v2/` 集成策略
5. 添加 maestro CLI PATH 检测

### Wave 3: 功能集成完善
6. CommandPalette 终端执行接入
7. DecisionNodeView 交互按钮

### Wave 4: UX 打磨
8. AnalysisPanel ErrorState 重试按钮

---

## Confidence Table

| Cluster | hypothesis_quality | evidence_completeness | root_cause_isolation | fix_confidence | Overall |
|---------|-------------------|----------------------|---------------------|----------------|---------|
| tRPC 基础设施 | 0.95 | 1.0 | 1.0 | 0.90 | **0.96 (HIGH)** |
| 外部依赖 | 0.85 | 0.90 | 0.85 | 0.80 | **0.85 (HIGH)** |
| 功能集成 | 0.90 | 1.0 | 0.95 | 0.85 | **0.92 (HIGH)** |
| UX 完善 | 1.0 | 1.0 | 1.0 | 0.95 | **0.99 (HIGH)** |

**Overall**: 0.91 (HIGH) — 所有 gaps 根因确认，可直接进入 fix 阶段。
