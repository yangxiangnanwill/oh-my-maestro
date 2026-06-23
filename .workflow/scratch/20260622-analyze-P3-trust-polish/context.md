# Context: Phase 3 — Trust & Polish

**Date**: 2026-06-22
**Areas discussed**: 审批门控架构、Windows 兼容性、性能优化、前端设计、技术债务

---

## Decisions

### Decision 1: GateManager 5 状态线性流转
- **Context**: 审批门控需要状态机管理审批生命周期
- **Options**:
  1. 5 状态线性流转 (pending→presented→approved/rejected/expired)
  2. 3 状态简化版 (pending→approved/rejected)
  3. 支持重新提交 (pending→presented→approved/rejected，可 re-present)
- **Chosen**: 5 状态线性流转
- **Reason**: presented 中间态允许展示 diff 预览后等待用户决策；30s 超时自动 expired 防止永久阻塞；RESOLVED 事件统一表示用户已决定

### Decision 2: 内联展开审批面板
- **Context**: 审批面板的 UI 交互模式
- **Options**:
  1. 内联展开面板（WorkflowCommander 下方展开）
  2. Modal 弹窗
  3. 侧边抽屉
- **Chosen**: 内联展开面板
- **Reason**: 不阻塞其他操作，与现有 WorkflowCommander 布局一致，用户可在查看 diff 的同时浏览其他信息

### Decision 3: MAINT-002 在 Phase 3 执行
- **Context**: TerminalManager 和 DialogManager 共享 ~40% session CRUD 模式
- **Options**:
  1. Phase 3 Wave 1 提取 SessionManager<T> 基类
  2. 继续推迟到 v0.4.0+
- **Chosen**: Phase 3 执行
- **Reason**: Phase 3 是最后一个计划里程碑，适合做架构整理；提取基类而非重写，风险可控

### Decision 4: 性能优化渐进交付
- **Context**: 4 个性能热点需要优化
- **Options**:
  1. 按优先级渐进 (P0→P1→P2)
  2. Wave 5 集中优化
  3. 仅 P0 优化
- **Chosen**: 按优先级渐进
- **Reason**: 每级独立可测试，降低回归风险；P0 先交付最大收益

### Decision 5: Diff 预览使用 Delegate dry-run
- **Context**: 审批面板需要展示即将执行的变更内容
- **Options**:
  1. Delegate dry-run (--mode analysis)
  2. 命令预览模式
  3. Git diff 预览
- **Chosen**: Delegate dry-run
- **Reason**: 复用现有 DelegateExecutor 基础设施，展示实际执行效果

### Decision 6: 所有写操作触发门控
- **Context**: 审批门控的触发范围
- **Options**:
  1. 所有 --mode write 操作
  2. 仅文件修改类
  3. 用户可配置
- **Chosen**: 所有写操作
- **Reason**: 最大化安全保护，简单明确的规则

---

## Constraints

### Locked
1. **GateManager 5 状态线性流转** — pending→presented→approved/rejected/expired，30s 超时
2. **内联展开审批面板** — WorkflowCommander 下方展开，不阻塞操作
3. **MAINT-002 在 Phase 3 执行** — 提取 SessionManager<T> 基类
4. **性能优化渐进交付** — P0→P1→P2 独立测试
5. **Diff 预览使用 Delegate dry-run** — --mode analysis 捕获 stdout
6. **所有写操作触发门控** — --mode write 均需审批

### Free
1. **审批面板具体 UI 样式** — 实现者可选择 Catppuccin Mocha 主题的具体颜色搭配
2. **超时时间** — 默认 30s，实现者可调整
3. **SessionManager 泛型设计** — 具体泛型参数和接口由实现者决定
4. **P1/P2 性能优化的具体实现细节** — 在满足验收标准的前提下自由选择

### Deferred
1. **用户可配置门控规则** — 推迟到 v0.4.0+，Phase 3 使用统一规则
2. **审批历史记录** — 推迟到 v0.4.0+
3. **批量审批** — 推迟到 v0.4.0+
4. **VS Code extension / JetBrains plugin** — 推迟到 v0.4.0+

---

## Code Context

### 审批门控集成点
- `src/lib/server/index.ts:92-100` — POST /api/workflows/execute 路由（插入 gate:pending 检查）
- `src/lib/client/components/WorkflowCommander.svelte:33-48` — executeWorkflow()（插入门控 UI 流程）
- `src/lib/shared/events.ts:9,48-54` — Channels.GATE + GateEvents（已定义，零使用）
- `src/lib/shared/types.ts:7,87-97` — GateStatus + ApprovalGate 接口（已定义，零使用）

### Windows 兼容性修复点
- `src/lib/server/index.ts:269-273` — SIGINT 处理器（添加 SIGBREAK + exit 兜底）
- `src/lib/server/terminal-manager.ts:41-50` — SHELL_WHITELIST（添加 wsl.exe）
- `src/lib/server/terminal-manager.ts:192-205` — resizeTerminal()（添加 _resizing 标记）

### 性能优化热点
- `src/lib/server/event-bus.ts:59-102` — publish()（添加 skipHistory 选项）
- `src/lib/server/ws-gateway.ts:124-145` — broadcastEvent()（批量广播优化）
- `src/lib/server/terminal-manager.ts:261-295` — startFrameThrottle()（动态启停）
- `src/lib/client/stores/index.ts:25-34` — connectionState polling（事件驱动）

### 技术债务
- `src/lib/server/terminal-manager.ts:59` — MAINT-002 TODO
- `src/lib/server/dialog-manager.ts` — MAINT-002 TODO

---

## Interview Decisions

| # | Decision | Choice | Source |
|---|----------|--------|--------|
| 1 | 分析方向 | 架构设计 + 平台兼容 + 性能优化 + 前端打磨 | user |
| 2 | 分析深度 | 深度分析 | user |
| 3 | GateManager 状态机 | 5 状态线性流转 | user |
| 4 | 审批面板 UI | 内联展开面板 | user |
| 5 | MAINT-002 | Phase 3 执行 | user |
| 6 | 性能优化策略 | 按优先级渐进 | user |
| 7 | Diff 数据来源 | Delegate dry-run | user |
| 8 | 门控触发条件 | 所有写操作 | user |
