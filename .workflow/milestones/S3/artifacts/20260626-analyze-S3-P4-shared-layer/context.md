# Context: S3 Phase 4 — src/lib 共享层迁移

**Date**: 2026-06-26
**Scope**: S3 Phase 4 — 补充 electron-app、trpc routers、workers 等共享模块
**Mode**: Quick (范围明确，跳过探索直接决策提取)

---

## 当前状态

oh-my-maestro `apps/desktop/src/lib/` 已有：
- `trpc/index.ts` — 基础 tRPC 初始化（无 superjson、无 Sentry middleware）
- `trpc/routers/` — 33 个路由目录，**全部为 Phase 3 stub**（空 `router({})`）
- `trpc/routers/command-chain/` + `trpc/routers/maestro/` — oh-my-maestro 独有路由
- `electron-app/` — 不存在
- `trpc/workers/` — 不存在
- `window-loader.ts` — 不存在

Superset 源 `apps/desktop/src/lib/` 包含：
- `trpc/index.ts` — 完整 tRPC（superjson transformer + Sentry middleware）
- `trpc/routers/` — 33 个路由，**全部完整实现**
- `trpc/workers/` — WorkerTaskRunner（后台任务执行）
- `electron-app/` — factories（app/setup, windows/create）+ utils
- `window-loader.ts` — 窗口加载器

---

## 差异分析

### DIRECT_COPY（直接复制，与品牌无关）

| 模块 | 文件数 | 说明 |
|------|--------|------|
| analytics | 1 | 分析路由 |
| auto-update | 1 | 自动更新路由 |
| browser | 1 | 浏览器路由 |
| browser-history | 1 | 浏览器历史 |
| cache | 1 | 缓存路由 |
| chat-runtime-service | 1 | 聊天运行时 |
| chat-service | 1 | 聊天服务 |
| config | 2 | 配置路由 |
| device | 1 | 设备路由（Superset 是单文件 .ts） |
| external | 3 | 外部集成（含 helpers.test.ts） |
| filesystem | 1 | 文件系统路由 |
| host-service-coordinator | 1 | 服务协调路由 |
| keyboardLayout | 1 | 键盘布局（Superset 是单文件 .ts） |
| menu | 1 | 菜单路由（Superset 是单文件 .ts） |
| migration | 1 | 迁移路由 |
| notifications | 1 | 通知路由（Superset 是单文件 .ts） |
| ports | 3 | 端口管理（含 label-cache.ts） |
| resource-metrics | 3 | 资源指标（含 schema + test） |
| ringtone | 1 | 铃声路由 |
| system | 1 | 系统路由（Superset 是单文件 .ts） |
| ui-state | 1 | UI 状态路由 |
| window | 1 | 窗口路由（Superset 是单文件 .ts） |
| utils | ~3 | 工具路由（oh-my-maestro 缺失） |
| workspace-fs-service | 1 | 工作区文件系统服务（oh-my-maestro 缺失） |
| trpc/workers/ | 3 | WorkerTaskRunner |
| electron-app/ | ~6 | factories + utils |
| window-loader.ts | 1 | 窗口加载器 |

### ADAPT（需要适配替换）

| 模块 | 文件数 | 适配内容 |
|------|--------|----------|
| **trpc/index.ts** | 1 | 合并 superjson + 移除 Sentry middleware（或标记可选） |
| **auth** | ~3 | 替换 Superset 认证逻辑为 Maestro 对应 |
| **changes** | ~10 | 替换 GitHub 集成引用，保留 git 操作核心 |
| **permissions** | ~4 | 排除 full-disk-access（Mac 特有） |
| **projects** | ~3 | 替换项目路径逻辑 |
| **settings** | ~7 | 替换 agent preset 引用 |
| **terminal** | ~5 | 替换 Superset 终端主题引用 |
| **workspaces** | ~5 | 替换工作区管理逻辑 |

### KEEP（oh-my-maestro 独有，保留不动）

| 模块 | 说明 |
|------|------|
| command-chain | Maestro 命令链路由 |
| maestro | Maestro 核心路由 |

### EXCLUDE（排除，不迁移）

| 模块 | 原因 |
|------|------|
| permissions/full-disk-access | Mac 特有 |
| Sentry middleware | 可选，Maestro 暂不需要 |
| changes/workers | GitHub 集成相关 |

---

## Decisions

### Decision 1: trpc/index.ts 合并策略

- **Context**: Superset 的 trpc/index.ts 包含 superjson transformer 和 Sentry middleware。oh-my-maestro 当前只有基础 initTRPC。
- **Options**:
  1. 完整复制 Superset 版本，Sentry 标记为可选
  2. 保持 oh-my-maestro 基础版本，逐步添加功能
- **Chosen**: Option 1 — 完整复制，Sentry middleware 用 try-catch 包裹
- **Reason**: superjson transformer 是 tRPC 最佳实践；Sentry 用动态 import 不会阻塞

### Decision 2: 单文件 vs 目录结构

- **Context**: Superset 有 8 个路由是单文件（device.ts, keyboardLayout.ts 等），oh-my-maestro 已创建为目录（device/index.ts 等）
- **Options**:
  1. 保持 oh-my-maestro 目录结构，将 Superset 内容放入 index.ts
  2. 改为 Superset 的单文件结构
- **Chosen**: Option 1 — 保持目录结构
- **Reason**: 目录结构便于后续扩展（添加 utils/test 子文件），且已有 stub 在目录中

### Decision 3: 迁移顺序

- **Context**: 33 个路由 + electron-app + workers + window-loader，规模大
- **Options**:
  1. 一次性全部迁移
  2. 分 Wave 渐进迁移
- **Chosen**: Option 2 — 分 4 Wave
- **Reason**: 依赖关系决定顺序；分批可验证；失败可回退

---

## Constraints

### Locked

1. **oh-my-maestro 独有路由必须保留**: command-chain、maestro 路由不覆盖
2. **排除 Mac 特有权限**: full-disk-access、local-network-permission 不迁移
3. **排除 GitHub 集成**: changes/workers 不迁移
4. **Sentry 标记为可选**: 不强制依赖 @sentry/electron
5. **目录结构保持**: 单文件 Superset 路由转为目录结构

### Free

1. trpc/index.ts 中 superjson 是否启用（推荐启用）
2. 各 ADAPT 路由的具体替换逻辑（实现者自行判断）
3. 是否立即创建 electron-app 还是推迟到 Phase 5

### Deferred

1. Sentry 完整集成 → Phase 5 或独立 Phase
2. GitHub PR/Issue 路由 → 独立 Phase（如果需要）
3. PostHog 分析 → 不迁移（永久排除）

---

## Wave 执行计划

### Wave 1: 基础层（无依赖）
- `trpc/index.ts` — 合并 superjson + Sentry middleware
- `electron-app/` — factories + utils（~6 files）
- `trpc/workers/` — WorkerTaskRunner（3 files）
- `window-loader.ts`

### Wave 2: DIRECT_COPY 路由（并行，~20 个模块）
analytics, auto-update, browser, browser-history, cache, chat-runtime-service, chat-service, config, device, external, filesystem, host-service-coordinator, keyboardLayout, menu, migration, notifications, ports, resource-metrics, ringtone, system, ui-state, window, utils, workspace-fs-service

### Wave 3: ADAPT 路由（串行，~7 个模块）
auth, changes, permissions, projects, settings, terminal, workspaces

### Wave 4: 编译验证
- `trpc/routers/index.ts` 合并所有路由导出
- `bun run typecheck` 验证
- 修复 @superset 引用

---

## Code Context

- Superset 源: `D:\WorkSpace\Source\superset\apps\desktop\src\lib\`
- oh-my-maestro 目标: `apps/desktop/src/lib/`
- 当前 stub 文件: 33 个路由目录各有一个 `index.ts` stub
- tRPC 基础: `apps/desktop/src/lib/trpc/index.ts`（已有基础 initTRPC）
