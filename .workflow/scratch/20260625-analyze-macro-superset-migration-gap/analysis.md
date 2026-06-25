# 分析：Superset → oh-my-maestro 迁移差异分析

**Artifact ID**: ANL-010
**Date**: 2026-06-25
**Scope**: Macro (Standalone)
**Go/No-Go**: GO
**Confidence**: High
**scope_verdict**: large

## 执行摘要

对比 Superset desktop 源码（D:\WorkSpace\Source\superset\apps\desktop）与 oh-my-maestro desktop 源码（D:\WorkSpace\VsCode\oh-my-maestro\apps\desktop），发现迁移时存在严重的文件缺失：

| 维度 | Superset | oh-my-maestro | 缺失率 |
|------|----------|---------------|--------|
| **desktop/src 总文件** | ~1,072 | 46 | **95.7%** |
| **main/lib 文件** | 124 | 15 | **87.9%** |
| **lib/trpc 文件** | 152 | 4 | **97.4%** |
| **renderer 文件** | ~769 | 26 | **96.6%** |

## 6 维评分

| 维度 | 分数 | 置信度 | 说明 |
|------|------|--------|------|
| Feasibility | 3/5 | 85% | 大部分文件可直接复制或轻量改造，但总量大（1000+ 文件） |
| Impact | 5/5 | 95% | 补充后项目可编译启动，功能完整度大幅提升 |
| Risk | 3/5 | 80% | 依赖链复杂，编译可能遇到模块间引用问题 |
| Complexity | 4/5 | 85% | 涉及 8 个模块，依赖关系复杂，需要按序补充 |
| Dependencies | 4/5 | 80% | 依赖 @superset/* workspace 包、better-sqlite3、node-pty 等原生模块 |
| Alternatives | N/A | — | 无替代方案，必须以 Superset 为基准补充 |

## 处理策略统计

| 策略 | 数量 | 说明 |
|------|------|------|
| DIRECT_COPY | ~400+ | 可直接从 Superset 复制 |
| ADAPT | ~200+ | 需要改造以适配 Maestro-flow |
| EXCLUDE | ~100+ | 计费/Stripe、GitHub 集成、Mac 权限 |
| KEEP | ~30 | oh-my-maestro 独有文件，保留 |

## 按模块处理概要

### G-01: 根目录文件（8 个缺失）
- AGENTS.md → ADAPT（创建 Maestro-flow 版本）
- CLAUDE.md → ADAPT（确保项目级存在）
- CODEX.md → ADAPT（创建并指向 AGENTS.md）
- CONTRIBUTING.md → ADAPT（替换仓库地址）
- DEVELOPMENT.md → ADAPT（简化开发流程）
- CODE_OF_CONDUCT.md → DIRECT_COPY
- WARP.md → ADAPT（创建并指向 AGENTS.md）
- Caddyfile.example → EXCLUDE

### G-02: Desktop 配置文件（12 个缺失）
- electron.vite.config.ts → ADAPT（关键：替换 URL 常量、移除 Sentry/PostHog）
- electron-builder.ts → ADAPT（关键：替换 appId、productName）
- package.json → NEEDS_MODIFY（大幅改造依赖和脚本）
- components.json → ADAPT
- bunfig.toml → ADAPT
- 其他 → ADAPT 或 DIRECT_COPY

### G-03: src/preload（1 个缺失）
- preload/index.ts → ADAPT（移除 Sentry、适配 Maestro 环境）

### G-04: src/main 主进程（~15 个缺失）
- host-service/ → ADAPT（替换为 Maestro MCP endpoint）
- pty-daemon/ → ADAPT
- terminal-host/ → DIRECT_COPY（~12 文件）
- windows/main.ts → ADAPT（替换品牌、preload 路径）
- network-logger/ → ADAPT
- git-task-worker.ts → EXCLUDE
- env.main.ts → ADAPT

### G-05: src/main/lib（~90 个缺失）
- agent-setup/ → 部分已迁移，需补充 ~20 文件
- terminal/ → 严重缺失，需补充 ~20 文件
- notifications/ → 需补充 ~8 文件
- analytics/ → EXCLUDE
- safe-url/ → DIRECT_COPY
- sanitize/ → DIRECT_COPY
- window-state/ → DIRECT_COPY
- 其他 20+ 模块 → 逐个审核

### G-06: src/lib 共享层（~115 个缺失）
- electron-app/ → ADAPT
- trpc/routers/ → 需补充 ~30 路由模块
- trpc/workers/ → DIRECT_COPY
- window-loader.ts → ADAPT

### G-07: src/renderer 前端（~740 个缺失）
- assets/ → ADAPT（替换品牌图标）
- commandPalette/ → ADAPT（选择性合并）
- components/ → SELECTIVE（~318 文件，排除 Paywall/PostHog 等）
- hooks/ → SELECTIVE（排除 V2/Relay 相关）
- hotkeys/ → DIRECT_COPY
- lib/ → SELECTIVE（排除 analytics/githubQueryPolicy）
- providers/ → SELECTIVE（排除 PostHogProvider）
- react-query/ → ADAPT
- routes/ → SELECTIVE（排除 automations）

## 风险矩阵

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 依赖链断裂 | 高 | 高 | 按依赖顺序补充，先基础设施后业务 |
| 编译错误 | 中 | 中 | 分批补充，每批后验证编译 |
| @superset/* 包引用 | 高 | 中 | 创建适配层或替换为本地实现 |
| 原生模块兼容 | 中 | 高 | Windows 上验证 better-sqlite3、node-pty |
| 文件量过大 | 高 | 中 | 优先 DIRECT_COPY 文件批量复制 |

## 建议执行顺序

1. **Wave 1**: 根目录文件 + Desktop 配置文件（G-01, G-02）
2. **Wave 2**: src/preload + src/lib/electron-app（G-03, G-06 部分）
3. **Wave 3**: src/main 核心 + src/main/lib 基础设施（G-04, G-05）
4. **Wave 4**: src/lib/trpc 路由（G-06 剩余）
5. **Wave 5**: src/renderer 前端（G-07）
6. **Wave 6**: 编译验证（G-08）
