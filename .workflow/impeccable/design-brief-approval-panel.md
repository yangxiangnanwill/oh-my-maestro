# Design Brief: ApprovalPanel

**Date**: 2026-06-22
**Session**: ANL-003 → Phase 3 Trust & Polish
**Target**: `src/lib/client/components/ApprovalPanel.svelte`
**Fidelity**: Production-ready

---

## Purpose

ApprovalPanel 是 Phase 3 审批门控的前端组件。当用户通过 WorkflowCommander 触发 `--mode write` 的工作流时，系统先执行 dry-run（`--mode analysis`），然后在 WorkflowCommander 下方内联展开 ApprovalPanel，展示即将执行的操作详情。用户确认后执行，拒绝后取消。

**用户心理状态**: 谨慎但高效 — 想确认 AI 不会做破坏性操作，但不想被阻塞流程。

## Users & Context

- **主要用户**: 不习惯 CLI 的开发者，通过 WorkflowCommander 触发工作流
- **使用频率**: 每次 `--mode write` 工作流执行时触发
- **上下文**: 在 WorkflowCommander 面板内，用户刚点击了执行按钮

## Content & Data

### 展示内容
1. **工作流元信息**: workflow 名称（翻译后）、参数列表、目标描述
2. **Dry-run 输出**: Delegate `--mode analysis` 的 stdout，展示即将执行的命令和预期效果
3. **风险等级**: 高（文件修改+删除）/ 中（文件修改）/ 低（只读操作），高风险标红
4. **额外上下文**: 预估影响文件数、执行历史（如有）

### 状态覆盖
| 状态 | 展示 |
|------|------|
| **加载中** | 骨架屏 + spinner + "正在分析操作影响..." |
| **已就绪** | 完整 diff/命令预览 + 确认/拒绝按钮 |
| **超时警告** | 倒计时 < 10s 时显示黄色警告 + "即将自动拒绝" |
| **已超时** | 面板关闭 + "审批已超时，操作自动取消" toast |
| **已确认** | 面板收起 + 执行开始（WorkflowCommander 显示进度） |
| **已拒绝** | 面板收起 + "操作已取消" toast |
| **错误** | 错误信息 + 重试按钮 + "跳过审批直接执行"（仅低风险） |

## Design Direction

### Visual Strategy
- **融入 WorkflowCommander**: 面板在 WorkflowCommander 下方内联展开，共享 Catppuccin Mocha 暗色主题
- **色彩策略**: Restrained — 以现有面板色为主，仅风险标识使用强调色
- **主题**: 暗色场景 — 开发者在暗色 IDE 中工作，面板需融入而非跳出

### Color Tokens (Catppuccin Mocha)
| Token | Hex | Usage |
|-------|-----|-------|
| `--ctp-base` | #1e1e2e | 面板背景 |
| `--ctp-surface0` | #313244 | 内容区背景 |
| `--ctp-surface1` | #45475a | 卡片/区块背景 |
| `--ctp-text` | #cdd6f4 | 主文本 |
| `--ctp-subtext0` | #a6adc8 | 次要文本 |
| `--ctp-overlay0` | #6c7086 | 禁用/占位文本 |
| `--ctp-blue` | #89b4fa | 信息/确认按钮 |
| `--ctp-green` | #a6e3a1 | 成功/低风险 |
| `--ctp-yellow` | #f9e2af | 警告/超时 |
| `--ctp-red` | #f38ba8 | 高风险/拒绝按钮 |
| `--ctp-mauve` | #cba6f7 | 中风险 |

### Anchor References
- **Linear** — 内联展开的问题详情面板（不阻塞其他操作）
- **Raycast** — 命令确认对话框的简洁性
- **GitHub PR Review** — diff 预览的布局和语法高亮

## Layout

```
┌─────────────────────────────────────────────┐
│ WorkflowCommander (existing)                │
│ ┌─────────────────────────────────────────┐ │
│ │ Category: Deploy  ▼                     │ │
│ │ [Execute: Deploy to Staging]  ← clicked │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ ApprovalPanel (expands inline below)        │
│ ┌─────────────────────────────────────────┐ │
│ │ ⚠️ 审批确认 — Deploy to Staging         │ │
│ │                                         │ │
│ │ 风险等级: 🔴 高风险 — 将修改服务器配置    │ │
│ │ 影响文件: 3 个                           │ │
│ │                                         │ │
│ │ ┌─ Dry-run 预览 ──────────────────────┐ │ │
│ │ │ $ maestro deploy --dry-run          │ │ │
│ │ │ > Building...                       │ │ │
│ │ │ > Deploying to staging...           │ │ │
│ │ │ > Files changed: config.yml, ...    │ │ │
│ │ └─────────────────────────────────────┘ │ │
│ │                                         │ │
│ │ ⏱ 29s 后自动拒绝                        │ │
│ │                                         │ │
│ │ [查看详情]  [拒绝]  [✓ 确认执行]        │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Interaction

1. 用户点击 WorkflowCommander 的执行按钮
2. WorkflowCommander 发出 `gate:pending` 事件
3. ApprovalPanel 在下方展开（slide-down 动画，200ms）
4. 同时触发 dry-run（展示加载状态）
5. Dry-run 完成 → 展示 diff 预览 + 30s 倒计时
6. 用户选择：
   - **确认**: 面板收起 → 发出 `gate:approved` → 执行开始
   - **拒绝**: 面板收起 → 发出 `gate:rejected` → toast 通知
   - **超时**: 自动拒绝 → toast 通知
7. 键盘快捷键: `Enter` = 确认, `Escape` = 拒绝

## Technical Constraints

- **Framework**: Svelte 5 ($state, $effect, $derived runes)
- **Theme**: Catppuccin Mocha（与现有组件一致）
- **No new dependencies**: 复用 marked.js（已有）做 diff 渲染
- **EventBus**: 通过 stores 订阅 `Channels.GATE` 事件
- **Accessibility**: WCAG 2.1 AA — 按钮可键盘操作，倒计时通过 aria-live 播报

## Anti-Goals

- ❌ 不要 Modal 弹窗 — 阻塞用户其他操作
- ❌ 不要自动执行 — 用户必须主动确认
- ❌ 不要隐藏技术细节 — dry-run 输出完整展示
- ❌ 不要引入新依赖 — 复用现有 Catppuccin 主题和 marked.js

## Scope

- **Fidelity**: Production-ready（生产就绪）
- **Breadth**: 单个组件 + WorkflowCommander 集成
- **Interactivity**: 完整交互（加载/就绪/超时/确认/拒绝/错误）
- **Time intent**: 直接可集成到 Phase 3 实现
