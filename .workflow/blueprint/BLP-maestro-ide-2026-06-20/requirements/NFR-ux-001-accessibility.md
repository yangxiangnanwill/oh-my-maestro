# NFR-UX-001: Accessibility and Usability Requirements

| Field | Value |
|-------|-------|
| **ID** | NFR-UX-001 |
| **Category** | Usability - Accessibility |
| **Priority** | Must |
| **Trace** | F-002, F-006, F-007, UX-04, UX-06 |

## Description

Maestro IDE 面向不习惯 CLI 的开发者，其可用性和可访问性直接决定用户能否有效使用产品。本需求定义了三个方面的可用性标准：键盘导航、暗色主题对比度和响应式布局。这些要求源自 UX Expert 的 cross-cutting positions 和 UI Designer 的视觉决策。

## Requirements

### UX-001-01: 键盘导航

Maestro IDE MUST 支持完整的键盘导航，确保不使用鼠标的用户能完成所有核心操作。

- 所有交互元素（按钮、链接、输入框、下拉选择）MUST 可通过 Tab 键按逻辑顺序访问。
- 当前焦点元素 MUST 有清晰的视觉焦点指示器（focus ring），对比度 MUST 满足 WCAG 2.1 AA 标准（至少 3:1 对比度）。
- Workflow Commander 中的工作流选择和触发 MUST 支持键盘操作（Enter 触发，Escape 取消）。
- AI Dialog 输入框 MUST 支持 Enter 发送消息，Shift+Enter 换行。
- Approval Gate 的三个决策控件（Approve、Reject、Modify）MUST 可通过键盘操作，焦点管理 MUST 在审批触发时移至审批面板，操作后返回先前焦点点。
- Approval Gate 的三个审查标签页（Summary、Diff Preview、Dry-Run Result）MUST 支持键盘切换。
- 面板切换（对话/工作流/终端）MUST 提供键盘快捷键。
- 简单/高级模式切换 MUST 可通过键盘访问。
- 全局导航 MUST 支持键盘快捷键快速访问主要功能区域。

### UX-001-02: 暗色主题对比度

Maestro IDE MUST 以暗色主题为默认（UI-02），且所有文本和交互元素 MUST 满足 WCAG 2.1 AA 对比度要求。

- 正文文本（主要内容）与背景的对比度 MUST 至少达到 4.5:1（WCAG 2.1 AA 级别）。
- 大文本（18px+ 或 14px+ 粗体）与背景的对比度 MUST 至少达到 3:1。
- 交互元素（按钮、链接）与背景的对比度 MUST 至少达到 4.5:1。
- 状态指示器 MUST 使用颜色 + 形状 + 图标组合传达含义，MUST NOT 仅依赖颜色传达信息（WCAG 2.1 1.4.1）。
- Diff 预览中的新增行和删除行 MUST 在颜色之外使用符号标记（如 + 和 - 前缀），确保色觉障碍用户可辨别。
- 焦点指示器与背景的对比度 MUST 至少达到 3:1。
- 禁用状态的元素 MUST 有足够的视觉区分度，用户 MUST NOT 尝试交互已禁用的控件。

### UX-001-03: 响应式布局

Maestro IDE MUST 适配不同屏幕尺寸，确保在常见开发者显示器分辨率下可用。

- 核心 MUST 采用双栏布局（左导航 + 右内容区），最小支持宽度为 1024px（UI-01）。
- 当窗口宽度低于 1280px 时，左导航栏 SHOULD 可折叠为图标模式，释放主内容区空间。
- 当窗口宽度低于 1024px 时，左导航栏 MUST 自动折叠，并可通过汉堡菜单展开。
- 右侧主内容区的三个面板（对话/工作流/终端）MUST NOT 同时并排展示，MUST 通过标签页切换（UI-04）。
- 终端面板 MUST 支持 xterm.js 自适应 resize，跟随容器尺寸变化调整列数和行数。
- Diff 预览在窄屏下 SHOULD 自动切换为 inline diff 模式（非 side-by-side）。
- 所有面板 MUST 在窗口 resize 时保持内容完整性，MUST NOT 因 resize 导致内容丢失或布局错乱。

### UX-001-04: 屏幕阅读器支持

关键交互面 MUST 支持屏幕阅读器导航。

- Approval Gate 的 diff 预览 MUST 可通过屏幕阅读器导航，每个变更块 MUST 有语义化的 ARIA 标签。
- 项目状态层级（项目 > 里程碑 > 阶段 > 步骤）MUST 使用 ARIA tree 角色，支持屏幕阅读器的层级导航。
- 工作流执行进度 MUST 通过 ARIA live region 实时播报状态变更。
- 面板切换 MUST 更新 ARIA 标签以反映当前活动面板。
- AI Dialog 的流式输出 MUST 在完整响应到达后通过 ARIA live region 播报，MUST NOT 逐 token 播报。

## Acceptance Criteria

1. 所有核心操作（触发工作流、发送 AI 对话、审批操作、切换面板、切换模式）MUST 可仅通过键盘完成，无需鼠标操作。
2. 暗色主题下所有文本对比度 MUST 通过 WCAG 2.1 AA 自动化检测（使用 axe-core 或等价工具）。
3. 布局在 1024px、1280px、1920px 三个断点下 MUST 保持可用且无内容溢出。
4. Approval Gate 的 diff 预览 MUST 可通过屏幕阅读器正确朗读变更内容。
5. 焦点指示器在所有主题和模式下 MUST 清晰可见，对比度 >= 3:1。

## Reference Standards

- **WCAG 2.1 Level AA**: https://www.w3.org/TR/WCAG21/
- **ARIA 1.2**: https://www.w3.org/TR/wai-aria-1.2/
- **对比度检测工具**: axe-core, Lighthouse Accessibility Audit
