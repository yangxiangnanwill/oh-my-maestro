# TASK-001: 安装缺失 npm 包

## Changes
- `apps/desktop/package.json`: 添加了 42 个缺失的依赖声明（dependencies 38 个 + devDependencies 1 个 + 已存在的 @xterm/addon-* 2 个 + @radix-ui/react-slot 1 个）
- `apps/desktop/bun.lock`: 自动更新锁定文件

### 安装明细

**@tiptap/* (28 个包, v3.27.1)**:
@tiptap/core, @tiptap/extension-blockquote, @tiptap/extension-bold, @tiptap/extension-bullet-list, @tiptap/extension-code, @tiptap/extension-code-block-lowlight, @tiptap/extension-document, @tiptap/extension-emoji, @tiptap/extension-hard-break, @tiptap/extension-heading, @tiptap/extension-history, @tiptap/extension-horizontal-rule, @tiptap/extension-image, @tiptap/extension-italic, @tiptap/extension-link, @tiptap/extension-list-item, @tiptap/extension-ordered-list, @tiptap/extension-paragraph, @tiptap/extension-placeholder, @tiptap/extension-strike, @tiptap/extension-table, @tiptap/extension-task-item, @tiptap/extension-task-list, @tiptap/extension-text, @tiptap/extension-underline, @tiptap/pm, @tiptap/react, @tiptap/suggestion

**其他包**:
tippy.js@6.3.7, streamdown@2.5.0, lowlight@3.3.0, react-syntax-highlighter@16.1.1

**@radix-ui/* (9 个包)**:
@radix-ui/react-slot@1.3.0, @radix-ui/react-collapsible@1.1.14, @radix-ui/react-hover-card@1.1.17, @radix-ui/react-popover@1.1.17, @radix-ui/react-context-menu@2.3.1, @radix-ui/react-dropdown-menu@2.1.18, @radix-ui/react-select@2.3.1, @radix-ui/react-switch@1.3.1, @radix-ui/react-checkbox@1.3.5

**类型包 (devDependency)**:
@types/react-syntax-highlighter@15.5.13

**已存在无需安装**:
@xterm/addon-fit@0.10.0, @xterm/addon-serialize@0.15.0-beta.220 (已在 package.json 中)

## Verification
- [x] `bun install` 无错误退出（exit code 0）: 通过 — `Checked 1248 installs across 1297 packages (no changes)`
- [x] `tsc --noEmit` TS2307 错误 < 70: 通过 — 从 160 降至 48（减少 112，超出目标 90+）
- [x] package.json dependencies 中包含关键包: 通过 — @tiptap/core, tippy.js, streamdown, lowlight, react-syntax-highlighter, @xterm/addon-fit, @xterm/addon-serialize, @radix-ui/react-slot 均已声明

## Tests
- [x] `bun install`: pass (exit 0, no changes needed)
- [x] `bun run typecheck` TS2307 count: 48 (was 160, delta -112)

## Deviations
- @xterm/addon-fit 和 @xterm/addon-serialize 已在 package.json 中声明，无需安装
- @radix-ui/react-slot 已在 node_modules 中作为传递依赖存在，但未在 package.json 中声明 — 已添加为直接依赖
- 跳过了 task 定义中提到的 @xterm/addon-clipboard, @xterm/addon-image, @xterm/addon-ligatures, @xterm/addon-progress, @xterm/addon-search, @xterm/addon-unicode11, @xterm/addon-webgl — 这些包在源码中未被引用，无需安装

## Notes
- 所有 @tiptap/* 包统一使用 v3.27.1，避免了版本兼容性风险
- 剩余 48 个 TS2307 错误可能涉及路径别名（@superset/* 等）或内部模块引用问题，留给后续任务处理
