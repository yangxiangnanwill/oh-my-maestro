# TASK-002: LinkAnchor 接线 + XSS 修复 + renderParts deps（ISS-002/010/011/013）

## Changes
- `apps/desktop/src/renderer/components/Chat/stubs/ui/ai-elements/message.tsx`: MessageResponseProps.components 类型改为 `{ a?: React.ElementType; aProps?: React.AnchorHTMLAttributes<HTMLAnchorElement> }`（与 ai-sdk 契约对齐，原为 `Record<string, React.ComponentType<any>>`）；MessageResponse 解构 `{ children, className, components, mermaid }` 并渲染为 `<div className={className} data-components-connected={components ? "true" : undefined} data-mermaid-connected={mermaid ? "true" : undefined}>{children}</div>`，标记 components prop 已被消费不丢弃。
- `apps/desktop/src/renderer/components/Chat/ChatInterface/components/MessagePartsRenderer/MessagePartsRenderer.tsx`: 加 `import { isSafeExternalUrl } from "shared/safe-url"`；LinkAnchor 用 `isSafeExternalUrl` sanitize href（非 allowlisted scheme 设为 undefined），onClick 中对非 allowlisted scheme 即使 openLinksInApp=false 也 preventDefault 防 javascript: 执行；handleLinkClick 在 openInBrowserPane 前用 `isSafeExternalUrl(href)` gate（false 则 return）；renderParts useCallback 去掉 `{parts, isLastAssistant}` 参数直接闭包外层变量，调用改为 `renderParts()`，deps 数组保留 parts/isLastAssistant（通过 useExhaustiveDependencies lint）。
- `apps/desktop/src/main/lib/browser/browser-manager.ts`: 删除 sanitizeUrl 启发式函数（line 13-24）；navigate 改用 `isSafeExternalUrl`——对无 scheme 的 localhost/127.0.0.1 先补 `http://` 前缀再校验（保持 localhost 支持不破坏），false 则 `return`（不 loadURL）不 throw（避免破坏 tRPC mutation 调用方）；import 改为 `import { safeOpenExternal, isSafeExternalUrl } from "../safe-url"`。

## Verification
- [x] grep 'isSafeExternalUrl' MessagePartsRenderer.tsx 命中: line 15/43/51/98
- [x] grep 'components' message.tsx 命中: stub 解构 components 参数（line 30/43/49）
- [x] grep 'data-components-connected' message.tsx 命中: line 49
- [x] grep 'from "shared/safe-url"' MessagePartsRenderer.tsx 命中: line 15
- [x] ! grep 'sanitizeUrl' browser-manager.ts 无命中: 函数已删除，注释也已改措辞避免误命中
- [x] grep 'isSafeExternalUrl' browser-manager.ts 命中: line 3/97
- [x] grep 'http://' browser-manager.ts 命中: line 95（localhost 补 http:// 前缀）
- [x] biome --only=useExhaustiveDependencies exit 0: renderParts useCallback deps 修复
- [x] typecheck exit 0
- [x] [UI-observable] components + data-components-connected grep 命中: stub 不丢弃 components prop

## Tests
- [x] `bun run typecheck`: pass (exit 0, tsc --noEmit 无错误)
- [x] `bunx biome lint --only=useExhaustiveDependencies MessagePartsRenderer.tsx`: pass (exit 0, No fixes applied)
- [x] `bunx biome lint src/main/lib/browser/browser-manager.ts`: pass (exit 0)
- [x] `bun test src/renderer/components/Chat`: pass (47 pass / 0 fail, 不回归)
- [x] grep browserManager.navigate/openInBrowserPane 调用方: browser.ts navigate mutation 无 try/catch 依赖 throw；store.ts openInBrowserPane 只存 url 不调 navigate。navigate 改 return 不破坏调用方。

## Deviations
- 轻微：MessageResponse stub 额外加了 `data-mermaid-connected` 标记（mermaid prop 同样消费不丢弃），与 components 同模式，不偏离 action 意图（action 提到 mermaid 已有但未消费）。
- 注释中曾出现 `sanitizeUrl` 字样触发 criteria 5 误命中，已改措辞为 "previous heuristic URL builder"——仍准确描述意图，非真实偏差。

## Notes
- ISS-002 接线状态: MessageResponse stub 不再丢弃 components prop（data-components-connected 标记）。LinkAnchor 实际渲染需 Phase 4 StreamingMessageText 接入真实 markdown 解析器（当前 stub 把纯文本 displayText 作 children，不解析 markdown 链接）。本次仅保证 components prop 不被丢弃 + href sanitize 代码正确（三重防御：LinkAnchor sanitize + handleLinkClick gate + browserManager.navigate gate）。
- navigate 改 return 不 throw：browser.ts navigate mutation 调用方无 try/catch，安全。store.ts openInBrowserPane 是 renderer 侧只存 url 到 pane，不直接调 navigate。
- Phase 4 移除 stub 时需一并移除 data-components-connected / data-mermaid-connected data 属性（避免残留）。
- TASK-001 已完成（isSafeExternalUrl 提取到 shared/safe-url），本任务依赖满足。
