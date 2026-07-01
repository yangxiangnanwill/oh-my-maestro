# Review Context — EXC-018 技术债务修复

## Phase Goal
S4 编译验证后代码审查发现 26 个问题（2 high, 10 medium, 14 low），分布在 correctness/security/architecture/maintainability/performance/best-practices 6 维。本计划按 4 Wave 修复：Wave1 低风险直接修复、Wave2 设计决策项、Wave3 Phase4 迁移准备、Wave4 延后项。

## Milestone
M-adhoc-20260628-tech-debt (active, adhoc, phase=null standalone)

## Tech Stack
Electron 40+ / React 19 / TailwindCSS / shadcn-ui / tRPC 11 / Zustand / TipTap / TypeScript strict / Biome / Bun monorepo

## Review Files (20)
1. apps/desktop/src/lib/trpc/routers/auth/utils/auth-functions.ts (56) — TASK-001/008: stub 改进, parseAuthDeepLink 返回 null
2. apps/desktop/src/renderer/routes/_authenticated/_dashboard/utils/workspace-navigation.ts (14) — TASK-001/010: 未使用参数注释, as never TODO
3. apps/desktop/src/renderer/components/AgentSelect/AgentSelect.tsx (110) — TASK-002/010: useMemo, as never TODO
4. apps/desktop/src/renderer/components/Chat/ChatInterface/components/ToolCallBlock/components/EditToolExpandedDiff/EditToolExpandedDiff.tsx (43) — TASK-002: useMemo
5. apps/desktop/src/renderer/lib/presets/index.ts (11) — TASK-003: 提取 invalidatePresetRelatedQueries
6. apps/desktop/src/renderer/stores/index.ts (56) — TASK-004: useSyncExternalStore 注释
7. apps/desktop/tsconfig.json (90) — TASK-004/005/007: noImplicitAny:false 注释, paths
8. apps/desktop/src/renderer/components/MarkdownEditor/MarkdownEditor.tsx (447) — TASK-006/012: html:false, TipTapExtensions
9. apps/desktop/src/shared/host-info-types.ts (40) — TASK-007: 新建纯类型文件
10. apps/desktop/src/main/lib/host-service-coordinator.ts (78) — TASK-007: re-export shared 类型
11. apps/desktop/src/main/lib/terminal-host/process-tree-stub.ts (55) — TASK-009: stub 警告
12. apps/desktop/src/renderer/lib/terminal/link-providers-stub.ts (28) — TASK-009: console.warn
13. apps/desktop/src/renderer/stores/tabs/store.ts (159) — TASK-009/010/011: url 存储, HMR 注释
14. apps/desktop/src/renderer/react-query/workspaces/useHandleOpenedWorktree.ts (59) — TASK-010: paneId TODO
15. apps/desktop/src/types/link-providers-route.d.ts (11) — TASK-011: export type 注释
16. apps/desktop/src/lib/trpc/routers/external/index.ts (283) — TASK-011: openInFinder 路径验证 TODO
17. apps/desktop/src/renderer/components/MarkdownRenderer/components/TipTapMarkdownRenderer/createMarkdownExtensions.ts (191) — TASK-011/012: ENABLE_RAW_MARKDOWN_HTML 警告
18. apps/desktop/src/renderer/lib/tiptap-utils.ts (12) — TASK-012: 新建 TipTapExtensions 类型
19. apps/desktop/src/renderer/components/MarkdownRenderer/components/TipTapMarkdownRenderer/TipTapMarkdownRenderer.tsx (179) — TASK-012: 使用共享类型
20. apps/desktop/src/renderer/components/Chat/ChatInterface/components/MessagePartsRenderer/MessagePartsRenderer.tsx (339) — TASK-013: 性能优化注释

## Phase 0 Pre-Check Result
关键收敛标准全部 MET:
- TASK-006: MarkdownEditor html:false ✅ (line 333)
- TASK-008: parseAuthDeepLink 返回 null ✅ (line 55)
- TASK-007: shared 类型 + re-export ✅
- TASK-012: TipTapExtensions 共享 + 两处使用 ✅
- TASK-002: useMemo ✅
- TASK-005: noImplicitAny 保持 false + Phase4 注释 ✅ (注意: plan title 说"恢复 true"但 design_decisions 决定保持 false, execute 遵循 design_decisions)

## 已知 plan/execute 偏差 (review 时关注)
- TASK-005: plan title "恢复 noImplicitAny: true" vs 实际保持 false (design_decisions 已记录保持 false 的决策)
- TASK-013: plan title "renderParts useCallback + 提取 a 组件" vs summary 实际只做"注释" (实现范围缩窄)

## Verification Gaps
(无 verification.json, gaps=[])

## Specs
(无 review category specs)
