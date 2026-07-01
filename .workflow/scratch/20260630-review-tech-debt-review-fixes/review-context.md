# Review Context — EXC-019 技术债务 review-fixes

## Phase Goal
修复 EXC-018 review (REV-001) 发现的 8 个 high findings (ISS-001~008)。6 个 task / 3 wave 已执行完成 (EXC-019)，verification VRF-001 status=passed。本次 review 验证：(1) 8 个 high 是否真正修复；(2) 修复是否引入新问题/回归。

## Milestone
M-adhoc-20260628-tech-debt (active, adhoc, standalone)

## Prior Review (REV-001, depends_on EXC-018)
8 个 high findings（已全部 resolved）：
- ISS-001 openInFinder 路径验证 → TASK-003
- ISS-002 MessagePartsRenderer memo → TASK-004
- ISS-003 @superset 别名迁移 → TASK-001
- ISS-004 移除 re-export → TASK-002
- ISS-005 noImplicitAny:true → TASK-001
- ISS-006 Biome + 缩进 → TASK-006
- ISS-007 单例 → TASK-002
- ISS-008 crypto.randomUUID → TASK-005

## Tech Stack
Electron 40+ / React 19 / TailwindCSS / shadcn-ui / tRPC 11 / Zustand / TipTap / TypeScript strict (noImplicitAny:true 已恢复) / Biome 2.5.1 (新引入) / Bun

## Review Files (25 源码 + biome.json + package.json)
### TASK-001 (ISS-005/003): tsconfig noImplicitAny + @superset 别名迁移
- apps/desktop/tsconfig.json — noImplicitAny false→true, 删除 13 个 main-layer @superset/* 别名, 保留 8 个 keep-list
- apps/desktop/src/main/index.full.ts — @superset/local-db → @main/lib/local-db (运行时值)
- apps/desktop/src/main/pty-daemon/index.ts — @superset/pty-daemon* → @main/lib/terminal-host/*
- apps/desktop/src/main/terminal-host/session.ts — @superset/shared/shell-ready-scanner → @main/*
- apps/desktop/src/main/terminal-host/pty-subprocess.ts — @superset/pty-daemon/process-tree → @main/*
- apps/desktop/src/main/lib/host-service-coordinator.ts — line-2 注释更新 (逻辑由 TASK-002 改)
- 6 个 renderer 文件 (commandPalette/core/types.ts, commandPalette/modules/openIn/commands.ts, OpenInButton.tsx, OpenInExternalDropdown/constants.ts, OpenInExternalDropdownItems.tsx, agent-session-orchestrator/types.ts) — @superset/local-db → @main/lib/local-db (type-only)

### TASK-002 (ISS-004/007): host-service-coordinator 单例 + 移除 re-export
- apps/desktop/src/main/lib/host-service-coordinator.ts — let instance + if(!instance) instance=new + return instance (注意: 原计划 ??= 被 TASK-006 biome lint 改为显式 if); 移除 export type re-export
- apps/desktop/src/lib/trpc/routers/host-service-coordinator/index.ts — 类型 import 改从 shared/host-info-types 直接导入

### TASK-003 (ISS-001): openInFinder 路径验证
- apps/desktop/src/lib/trpc/routers/external/index.ts — openInFinder 加 isAbsolute guard + BAD_REQUEST, 删 TODO

### TASK-004 (ISS-002): MessagePartsRenderer memo
- apps/desktop/src/renderer/components/Chat/ChatInterface/components/MessagePartsRenderer/MessagePartsRenderer.tsx — LinkAnchor = React.memo (模块级); renderParts useCallback; components useMemo 返回 {a: LinkAnchor, aProps:{onClick: handleLinkClick}}

### TASK-005 (ISS-008): crypto.randomUUID
- apps/desktop/src/renderer/stores/tabs/store.ts — 移除 tabCounter/paneCounter, nextTabId/nextPaneId 返回 crypto.randomUUID()

### TASK-006 (ISS-006): Biome + 缩进
- apps/desktop/biome.json (新建) — indentStyle: tab, indentWidth: 2, preset: recommended
- apps/desktop/package.json — @biomejs/biome@^2.5.1 devDep + lint/lint:fix/format/format:check scripts
- 12 个文件 tab 缩进转换 (上述多数文件)
- **额外修复 2 个 lint ERROR**: host-info-types.ts 空 interface → type = Record<string,never>; host-service-coordinator.ts ??= → 显式 if

## Verification Gaps (VRF-001, status=passed)
- GAP-001 (low): TASK-002 criterion C2 文本漂移 (??= → if, 功能等价)
- GAP-002 (medium): TASK-004 [UI-observable] 需人工 dev app 验证流式渲染 (executor 无法启动 Electron, ISS-002 已标 resolved 但未运行时验证)
- GAP-003 (low): 全量 bun run lint exit 1 (38 errors/316 warnings, 存量问题, 超出 scope)

## 本次 Review 特殊聚焦
1. **TASK-004 回归风险**: LinkAnchor 提取 + components useMemo 返回 {a, aProps} 是否破坏 StreamingMessageText 的 components.a 契约? 流式渲染是否回归? (GAP-002)
2. **TASK-006 额外修复**: host-info-types.ts 空 interface → Record<string,never> 是否破坏类型契约? host-service-coordinator.ts ??= → if 是否真的等价?
3. **TASK-001 别名迁移**: 6 个零消费者别名直接删除未补 @main/* 等价项是否安全? @superset/mcp-v2 保留是否正确?
4. **TASK-003 行为变更**: openInFinder 现在拒绝相对路径, renderer 调用方是否都传绝对路径?
5. **TASK-005 ID 格式变更**: tab/pane ID 从 tab-N-timestamp 变为纯 UUID, 是否有代码解析旧格式?
6. **Biome 引入**: biome.json 配置是否合理? 是否与项目约定一致?

## Specs
(无 review category specs)
