# S3 Phase 4 分析 — 讨论记录

**Session**: ANL-011
**Date**: 2026-06-26
**Mode**: Quick（范围明确，跳过探索直接决策提取）
**Scope**: S3 Phase 4 — src/lib 共享层迁移

---

## 关键发现

### 1. 当前状态：全部为 Phase 3 stub

oh-my-maestro `src/lib/trpc/routers/` 下有 33 个路由目录，每个只有一个 `index.ts` stub 文件，内容为空的 `router({})`。这些是 TASK-021（编译验证）时创建的占位文件，确保 tsc 编译通过。

### 2. Superset 源差异

| 类别 | 数量 | 处理方式 |
|------|------|----------|
| DIRECT_COPY | ~24 模块 | 直接复制，替换 import 路径 |
| ADAPT | ~7 模块 | 需替换 Superset 业务逻辑 |
| KEEP | 2 模块 | command-chain, maestro（不动） |
| EXCLUDE | 3 类 | Mac 权限、GitHub 集成、Sentry |
| 缺失目录 | 3 个 | electron-app/, workers/, window-loader.ts |

### 3. 关键风险

- **@superset 包引用**: trpc/index.ts 引用 `@sentry/electron`，多个路由引用 `@superset/local-db`、`shared/constants` 等
- **superjson 依赖**: 需要 `bun add superjson`
- **单文件→目录转换**: 8 个 Superset 单文件路由需适配为目录结构

---

## 决策记录

| # | Decision | Choice | Source | Confidence |
|---|----------|--------|--------|------------|
| 1 | trpc/index.ts 合并策略 | 完整复制，Sentry 可选 | code | high |
| 2 | 单文件 vs 目录结构 | 保持目录结构 | code | high |
| 3 | 迁移顺序 | 分 4 Wave | code | high |
| 4 | scope_verdict | medium（1-2 子系统，可并行） | code | high |

---

## Next Step

scope_verdict = **medium** → 建议 `/maestro-plan S3 Phase 4`
