# Roadmap: Superset → oh-my-maestro 文件补充路线图

**基于**: ANL-010（Superset → oh-my-maestro 迁移差异分析）
**创建日期**: 2026-06-25
**scope_verdict**: large（3+ 独立子系统，需串行依赖屏障）
**策略**: Progressive（4 Phase 串行，每个 Phase 自包含可验证）

---

## Overview

基于 ANL-010 宏分析结论（oh-my-maestro desktop 缺失 95.7% 的 Superset 源文件），本路线图定义 4 Phase 渐进式补充路径：从基础设施（配置+根目录）→ 主进程（main+lib）→ 共享层（lib/trpc）→ 前端（renderer）。每个 Phase 自包含、可编译验证、可回退。

**排除范围（全 Phase 通用）**：
- 计费相关（Stripe/Paywall）
- GitHub 集成（PR/Issue/changes 路由）
- Mac 特有权限（full-disk-access/local-network-permission/apple-events/dock-icon/tray）
- PostHog/Sentry 分析追踪
- Superset V2 特有功能（V2AvailableBanner/useV2AgentChoices 等）

---

## Roadmap Decisions

| # | Decision | Choice | Source |
|---|----------|--------|--------|
| 1 | 分解策略 | Progressive（4 Phase 串行） | ANL-010 scope_verdict=large |
| 2 | Phase 数量 | 4（+ Phase 0 环境验证） | 依赖屏障：配置→主进程→共享层→前端 |
| 3 | 文件复制策略 | 批量 DIRECT_COPY + 逐个 ADAPT | ANL-010 策略统计 |
| 4 | @superset/* 包处理 | 创建本地适配层，逐步替换引用 | ANL-010 风险矩阵 |
| 5 | 编译验证节点 | 每个 Phase 末尾验证 bun install + tsc | 完成标准 EC-03 |
| 6 | oh-my-maestro 独有文件 | 全部保留（KEEP），不覆盖 | ANL-010 KEEP 策略 |

---

## Milestones

### Milestone S1: Foundation — 基础设施就位 (v0.4.0)

**Target**: 根目录文件 + Desktop 配置文件就位，bun install 成功，项目结构完整。

**Status**: planned

**Phases**:
- [ ] **Phase 0: 环境验证** — 确认 Superset 源可用，oh-my-maestro 当前状态可回退
- [ ] **Phase 1: 根目录 + 配置文件补充** — 补充 20 个文件（8 根目录 + 12 desktop 配置）

#### Phase 0: 环境验证
**Goal**: 确认源和目标状态，建立回退点
**Depends on**: Nothing
**Success Criteria**:
1. Superset 源目录 D:\WorkSpace\Source\superset 可访问
2. oh-my-maestro 当前状态已 git commit（回退点）
3. 两个项目的文件计数已确认

#### Phase 1: 根目录 + 配置文件补充
**Goal**: 所有必需的根目录文件和构建配置文件就位
**Depends on**: Phase 0
**Success Criteria**:
1. 根目录 8 个文件已补充（AGENTS.md, CLAUDE.md, CODEX.md, CONTRIBUTING.md, DEVELOPMENT.md, CODE_OF_CONDUCT.md, WARP.md, .gitignore）
2. Desktop 12 个配置文件已补充（electron.vite.config.ts, electron-builder.ts, package.json 改造等）
3. bun install 无错误

**Wave DAG**:
```
Wave 1: [根目录文件: AGENTS.md, CLAUDE.md, CODEX.md, CONTRIBUTING.md, DEVELOPMENT.md, CODE_OF_CONDUCT.md, WARP.md] (并行)
Wave 2: [.gitignore + .env.example + .github/ 基础] (并行)
Wave 3: [electron.vite.config.ts + electron-builder.ts + package.json 改造] (核心配置，串行)
Wave 4: [其他配置文件: bunfig.toml, components.json, index.d.ts, runtime-dependencies.ts, RELEASE.md, BUILDING.md, create-release.sh, electron-builder.canary.ts, .npmrc]
Wave 5: [bun install 验证]
```

---

### Milestone S2: Core — 主进程完整 (v0.5.0)

**Target**: src/main 和 src/main/lib 完整，Electron 主进程可启动。

**Status**: planned

**Phases**:
- [ ] **Phase 2: src/main 核心 + src/preload** — 补充 preload、main 入口、host-service、pty-daemon、terminal-host、windows
- [ ] **Phase 3: src/main/lib 基础设施** — 补充 agent-setup、terminal、safe-url、sanitize、window-state 等核心 lib

#### Phase 2: src/main 核心 + src/preload
**Goal**: Electron 主进程核心模块就位
**Depends on**: Phase 1（配置文件就位）
**Success Criteria**:
1. src/preload/index.ts 已就位
2. src/main/index.ts 已合并 Superset 功能
3. src/main/env.main.ts 已适配
4. src/main/host-service/ 已适配
5. src/main/pty-daemon/ 已适配
6. src/main/terminal-host/ 已就位（~12 文件）
7. src/main/windows/main.ts 已适配
8. src/main/network-logger/ 已适配

**Wave DAG**:
```
Wave 1: [preload/index.ts] (独立)
Wave 2: [env.main.ts + app-environment.ts + app-state/] (环境基础)
Wave 3: [terminal-host/ 全部 12 文件 + pty-daemon/] (终端基础设施，DIRECT_COPY)
Wave 4: [host-service/ + windows/main.ts] (窗口和服务)
Wave 5: [main/index.ts 合并 + network-logger/]
```

#### Phase 3: src/main/lib 基础设施
**Goal**: main/lib 核心模块就位，agent-setup 完整
**Depends on**: Phase 2（main 核心就位）
**Success Criteria**:
1. agent-setup/ 补充 ~20 缺失文件（agent wrappers + templates）
2. terminal/ 补充 ~20 文件（session、daemon、port-manager 等）
3. safe-url/ + sanitize/ 就位
4. window-state/ 就位
5. local-db/ 就位
6. persistence/ 就位
7. 其他 DIRECT_COPY 模块就位（keyboardLayout, tree-kill, data-batcher, terminal-escape-filter, terminal-history, host-service-utils, extensions, browser, bundled-cli, auto-updater, menu, menu-events, dev-workspace-name, host-service-coordinator, host-service-manifest, project-icons）
8. oh-my-maestro 独有文件保留（command-chain-status-poller, websocket-event-bus, maestro-mcp-provider, ralph-decision-bridge）

**Wave DAG**:
```
Wave 1: [safe-url/ + sanitize/ + tree-kill.ts + data-batcher.ts + keyboardLayout.ts] (无依赖工具)
Wave 2: [local-db/ + persistence/ + app-state/] (数据层)
Wave 3: [terminal/ 全部 + terminal-escape-filter + terminal-history + terminal-host/lib] (终端层)
Wave 4: [agent-setup/ 补充: 6 agent wrappers + shell-wrappers + 7 templates + utils + tests]
Wave 5: [window-state/ + menu.ts + menu-events.ts + auto-updater.ts + bundled-cli.ts]
Wave 6: [其他: browser, extensions, host-service-*, dev-workspace-name, project-icons]
```

---

### Milestone S3: Integration — 共享层 + 前端 (v0.6.0)

**Target**: src/lib 共享层完整 + src/renderer 前端完整，应用可启动。

**Status**: planned

**Phases**:
- [ ] **Phase 4: src/lib 共享层** — 补充 electron-app、trpc routers、workers
- [ ] **Phase 5: src/renderer 前端** — 补充 assets、components、hooks、providers、routes

#### Phase 4: src/lib 共享层
**Goal**: tRPC 路由和共享模块就位
**Depends on**: Phase 3（main/lib 就位）
**Success Criteria**:
1. electron-app/ 就位（factories + utils）
2. window-loader.ts 就位
3. trpc/workers/ 就位
4. trpc/routers/ 补充 ~30 路由模块（排除 changes、permissions/full-disk-access）
5. oh-my-maestro 独有路由保留（command-chain, maestro）

**Wave DAG**:
```
Wave 1: [electron-app/ + window-loader.ts + trpc/workers/] (基础层)
Wave 2: [DIRECT_COPY 路由: analytics, auto-update, browser, browser-history, cache, device, external, filesystem, keyboardLayout, notifications, ports, resource-metrics, ringtone, system, terminal, ui-state, utils, window, workspace-fs-service] (并行)
Wave 3: [ADAPT 路由: auth, chat-runtime-service, chat-service, config, host-service-coordinator, menu, migration, permissions.ts, projects, settings, workspaces]
Wave 4: [trpc/index.ts + trpc/routers/index.ts 合并]
```

#### Phase 5: src/renderer 前端
**Goal**: 前端模块完整，Maestro 特有组件整合
**Depends on**: Phase 4（共享层就位）
**Success Criteria**:
1. assets/ 就位（替换品牌图标，排除 stripe-link.png）
2. components/ 补充 ~300 文件（排除 Paywall/PostHog/V2）
3. hooks/ 补充 ~50 文件（排除 V2/Relay 相关）
4. hotkeys/ 就位（~27 文件）
5. lib/ 补充 ~120 文件（排除 analytics/githubQueryPolicy）
6. providers/ 补充（排除 PostHogProvider）
7. react-query/ 补充（适配 Maestro API）
8. routes/ 补充（排除 automations）
9. oh-my-maestro 独有组件保留（AnalysisPanel, CommandChainPanel, KnowledgePanel, TranslationContext）

**Wave DAG**:
```
Wave 1: [assets/ + globals.css + index.html + index.tsx + env.d.ts + env.renderer.ts] (入口层)
Wave 2: [lib/ DIRECT_COPY: fileIcons, formatPath, formatRelativeTime, pathBasename, performance, persistent-hash-history, pierreTree, ringtones, tiptap, clickPolicy, terminal] (工具层)
Wave 3: [hotkeys/ + hooks/ 通用部分] (交互层)
Wave 4: [providers/ + react-query/] (数据层)
Wave 5: [components/ DIRECT_COPY: BootErrorBoundary, ColorSelector, CommentMarkdown, ConfigFilePreview, EmojiTextInput, HotkeyMenuShortcut, icons, MarkdownEditor, MarkdownRenderer, OpenInButton, OpenInExternalDropdown, PickerTrigger, RemotePathPicker, ThemedToaster, ThemeSwatch, UpdateRequiredPage, UpdateToast]
Wave 6: [components/ ADAPT: AgentSelect, Chat, NewWorkspaceModal]
Wave 7: [routes/ + commandPalette/ 选择性合并]
```

---

### Milestone S4: Verify — 编译验证 (v0.7.0)

**Target**: 全量编译通过，应用可启动，功能正常。

**Status**: planned

**Phases**:
- [ ] **Phase 6: 编译验证** — bun install + tsc + bun run dev

#### Phase 6: 编译验证
**Goal**: 全量编译通过，启动正常
**Depends on**: Phase 5（前端就位）
**Success Criteria**:
1. `bun install` 无错误
2. `bun run build` 或 `tsc --noEmit` 无错误
3. `bun run dev` 成功启动
4. Electron 窗口正常打开
5. 终端面板可输入命令
6. Maestro 特有功能正常（CommandChainPanel, AnalysisPanel, KnowledgePanel）

**Wave DAG**:
```
Wave 1: [bun install 依赖安装]
Wave 2: [TypeScript 编译检查 + 错误修复]
Wave 3: [bun run dev 启动验证]
Wave 4: [功能回归: 终端 + 命令面板 + Maestro 面板]
```

---

## Scope Decisions

- **In scope**: 根目录文件、Desktop 配置、src/preload、src/main、src/main/lib、src/lib、src/renderer
- **Excluded**: 计费(Stripe)、GitHub 集成(PR/Issue)、Mac 权限、PostHog/Sentry、V2 特有功能
- **Deferred (v0.8.0+)**: apps/api 迁移、apps/admin 迁移、E2E 测试完善、CI/CD 配置

---

## Progress

| Milestone | Phase | Status | Target Files |
|-----------|-------|--------|-------------|
| S1 Foundation | 0. 环境验证 | Not started | — |
| S1 Foundation | 1. 根目录+配置 | Not started | ~20 |
| S2 Core | 2. main 核心+preload | Not started | ~30 |
| S2 Core | 3. main/lib 基础设施 | Not started | ~90 |
| S3 Integration | 4. lib 共享层 | Not started | ~115 |
| S3 Integration | 5. renderer 前端 | Not started | ~740 |
| S4 Verify | 6. 编译验证 | Not started | — |

---

## Requirements Traceability

| REQ | Milestone | Phase | Priority | Source |
|-----|-----------|-------|----------|--------|
| REQ-S-001 | S1 Foundation | P1 | must | ANL-010 G-01, G-02 |
| REQ-S-002 | S2 Core | P2 | must | ANL-010 G-03, G-04 |
| REQ-S-003 | S2 Core | P3 | must | ANL-010 G-05 |
| REQ-S-004 | S3 Integration | P4 | must | ANL-010 G-06 |
| REQ-S-005 | S3 Integration | P5 | must | ANL-010 G-07 |
| REQ-S-006 | S4 Verify | P6 | must | ANL-010 G-08 |

**All 6 requirements mapped** ✅ | **0 gaps** ✅
