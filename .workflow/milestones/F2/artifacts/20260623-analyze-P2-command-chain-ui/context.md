# Context: Phase 2 — 命令链 UI

**Date**: 2026-06-23
**Source**: ANL-010
**Areas discussed**: status.json 解析、React 组件设计、文件轮询机制、术语翻译应用

## Decisions

### Decision 1: 状态同步机制
- **Context**: 如何实时获取 Maestro-flow 的命令链状态
- **Options**:
  1. 文件轮询 status.json（Phase 2 推荐）
  2. WebSocket 推送（需要修改 Maestro-flow）
  3. SSE 事件流
- **Chosen**: 方案 A (文件轮询)
- **Reason**: 最小侵入、无需修改 Maestro-flow、Phase 3 可升级到 WebSocket

### Decision 2: UI 组件架构
- **Context**: 在 Superset React 组件树中什么位置渲染命令链状态
- **Options**:
  1. Sidebar 面板（类似现有 Dashboard Sidebar）
  2. 独立 Tab/Panel
  3. 内联到 Chat/Terminal 区域
- **Chosen**: 方案 A (Sidebar 面板)
- **Reason**: 符合 Superset 现有架构模式、用户可随时查看

### Decision 3: 术语翻译应用
- **Context**: 如何在 UI 中应用概念翻译层
- **Options**:
  1. 直接使用 TRANSLATIONS 注册表（从 Phase 0 设计文档）
  2. 新建 React Context + useTranslation hook
- **Chosen**: 方案 B
- **Reason**: React 原生模式、支持简单/高级模式切换

## Constraints

### Locked
1. **必须实时反映 status.json 状态** — 延迟 < 2s
2. **必须应用概念翻译层** — 简单模式默认
3. **必须与 Superset React 组件体系一致** — shadcn/ui + TailwindCSS v4
4. **必须在 Sidebar 中可见** — 不阻塞主工作区

### Free
1. 文件轮询间隔 — 500ms / 1s / 2s
2. 组件具体样式
3. 颜色方案

### Deferred
1. WebSocket 实时推送 — Phase 3
2. 命令链历史 — Phase 3
3. 交互式决策节点 — Phase 3
