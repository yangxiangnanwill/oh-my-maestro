# TASK-007: 修复隐式 any 和残余类型错误

## 变更
- `AgentSelect.tsx`: 将 `navigate({ to: "/settings/agents" })` 改为 `navigate({ to: "/settings/agents" as never })`，绕过 TanStack Router 路由类型检查（路由树为空桩）
- `MessagePartsRenderer.tsx`: 将 `exploringItems` 的返回对象从 `{icon, title, subtitle, isPending, isError}` 映射为 `ExploringGroup` 期望的 `{icon, label, description, status}` 字段
- `EditToolExpandedDiff.tsx`: 为 `viewMode` 添加默认值 `?? "split"`，解决 `string | undefined` 到 `string` 的类型不匹配
- `MarkdownEditor.tsx`: 将 `Markdown.configure({html, transformPastedText, transformCopiedText})` 改为嵌套在 `markdownOptions` 下；为 `extensions` 数组添加类型断言
- `createMarkdownExtensions.ts`: 将 `html`、`transformPastedText`、`transformCopiedText` 移入 `markdownOptions` 嵌套对象
- `TipTapMarkdownRenderer.tsx`: 为 `createMarkdownExtensions()` 返回值添加类型断言
- `link-providers-stub.ts`: 更新 `UrlLinkProvider` 桩构造函数以接受 4 个参数（兼容真实 VSCode 提供者签名）；将 `MouseEvent` 改为 `globalThis.MouseEvent`
- `terminal-runtime.ts`: 为 `XTerm` 构造函数选项添加 `as any` 类型断言（`vtExtensions` 是 xterm.js 有效选项但不在类型定义中）
- `presets/index.ts`: 为 `useQuery` 返回值添加显式类型断言 `{data: TerminalPreset[] | undefined; isLoading: boolean}`；添加 `TerminalPreset` 导入
- `useHandleOpenedWorktree.ts`: 包装 `addTab` 调用以返回 `{tabId, paneId}` 而非仅 `string`
- `workspace-navigation.ts`: 将 `navigate` 调用参数改为 `as never` 类型断言

## 验证
- [x] tsc --noEmit 错误数 < 20: 0 个错误
- [x] TS7006 错误归零: 初始无 TS7006 错误（所有 13 个错误均为其他类型）
- [x] TS7031 错误归零: 初始无 TS7031 错误
- [x] TS2339 错误归零: 初始无 TS2339 错误

## 测试
- [x] `bun run typecheck`: 通过，0 个错误

## 偏差
- 实际错误数量（13 个）远低于计划预估（300+），因为之前 TASK-001~TASK-006 已修复大量错误
- 未使用 `noImplicitAny: false` 临时方案，因为所有错误均可直接修复
- 路由类型错误（AgentSelect、workspace-navigation）使用 `as never` 断言而非修复路由树，因为路由树为桩实现

## 备注
- 11 个文件修改，+46/-22 行
- 所有修复均为最小化变更，未进行重构
- `vtExtensions` 是 xterm.js 的合法选项（kitty keyboard protocol），类型定义不完整导致 TS2353
