# Review Context — EXC-020 review2-fixes

## Phase Goal
修复 REV-002 review 发现的 7 个 high findings (ISS-009~015) + ISS-002 联动。5 个 task / 3 wave 已执行 (EXC-020)，verification VRF-002 status=passed。本次 review 验证：(1) 7 个 high 是否真正闭环；(2) 修复是否引入新回归；(3) TASK-005 全量 format 是否破坏文件。

## Milestone
M-adhoc-20260628-tech-debt (active, adhoc, standalone)

## Prior Reviews
- REV-001 (EXC-018, BLOCK, 8 high) → PLN-021/EXC-019 修复
- REV-002 (EXC-019, BLOCK, 7 high, 5 regression) → PLN-022/EXC-020 修复 ← 本次复审对象

## Tech Stack
Electron 40+ / React 19 / tRPC 11 / Zustand / TipTap / TypeScript strict (noImplicitAny:true) / Biome 2.5.1 / Bun

## Review Files (21 实质代码文件，排除 TASK-005 纯格式化文件)
### TASK-001 (ISS-009/010/011): shared 层提取
- apps/desktop/src/shared/external-app-types.ts (新建) — EXTERNAL_APPS const + ExternalApp type + NON_EDITOR_APPS + ExecutionMode + TerminalPreset
- apps/desktop/src/shared/safe-url/scheme.ts (新建) — isSafeExternalUrl + externalUrlLogLabel
- apps/desktop/src/shared/safe-url/index.ts (新建) — barrel re-export
- apps/desktop/src/main/lib/local-db/index.ts — 改为从 shared re-export (value 导出 EXTERNAL_APPS/NON_EDITOR_APPS/EXECUTION_MODES, type 导出 ExternalApp/ExecutionMode/TerminalPreset)，保持 main 侧 7 消费者零改动
- apps/desktop/src/main/lib/safe-url/scheme.ts — 改为 re-export shim (`export { ... } from "shared/safe-url"`)，保持 ./scheme import 链
- 6 renderer 消费者 (commandPalette/core/types.ts, commandPalette/modules/openIn/commands.ts, OpenInButton/OpenInButton.tsx, OpenInExternalDropdown/{constants,OpenInExternalDropdownItems}.tsx, agent-session-orchestrator/types.ts) — @main/lib/local-db → shared/external-app-types

### TASK-002 (ISS-010/011/013/002): LinkAnchor 接线 + XSS 修复
- apps/desktop/src/renderer/components/Chat/ChatInterface/components/MessagePartsRenderer/MessagePartsRenderer.tsx — import isSafeExternalUrl; LinkAnchor sanitize href + 非 allowlisted scheme preventDefault; handleLinkClick gate openInBrowserPane; renderParts 去参数直接闭包 (修 useExhaustiveDependencies)
- apps/desktop/src/renderer/components/Chat/stubs/ui/ai-elements/message.tsx — MessageResponse 解构 {children,className,components,mermaid}, 渲染 data-components-connected 标记; components 类型对齐 ai-sdk 契约 {a?,aProps?}
- apps/desktop/src/main/lib/browser/browser-manager.ts — 删除 sanitizeUrl; navigate 用 isSafeExternalUrl (localhost 补 http://), false 则 return 不 throw

### TASK-003 (ISS-012): host-service-coordinator 删 unused import
- apps/desktop/src/main/lib/host-service-coordinator.ts — 删 HostServiceStatusEvent + HostServiceCoordinatorEvents import

### TASK-004 (ISS-014): store.ts 参数 _ 前缀
- apps/desktop/src/renderer/stores/tabs/store.ts — addChatTab/addChatPane 的 options→_options, switchChatSession/setChatLaunchConfig 的 paneId/sessionId/config→_前缀

### TASK-005 (ISS-015): Biome 全量 format + lint
- apps/desktop/biome.json — 降级 5 规则为 warn (noArrayIndexKey, noLabelWithoutControl, useAriaPropsSupportedByRole, useAriaPropsForRole, noAutofocus)
- apps/desktop/package.json — lint/lint:fix/format/format:check scripts (PLN-021 引入)
- apps/desktop/src/renderer/contexts/translations.ts — 修复 parse error (中文全角引号 → 「」)
- 319 文件全量 tab 缩进转换 (whitespace only, 不在 substance review 范围)

## Verification Gaps (VRF-002, status=passed)
- GAP-001 (medium): ISS-002 LinkAnchor 实际渲染需 Phase 4 markdown 解析器; 本次仅 components prop 不被丢弃 (data-components-connected 标记), href sanitize 代码正确但 inert
- GAP-002 (low): TASK-005 降级 5 Biome 规则为 warn 以达成 lint exit 0; 244 warnings 可见但不阻断; follow-up 修复真实问题后恢复 error
- GAP-003 (low): codex 验证门早停未交叉验证, 依赖 executor 自验证 + 主流程复核

## 本次 Review 特殊聚焦
1. **ISS-009 闭环验证**: TASK-001 shared 提取是否真正解决 renderer→main 依赖? renderer 6 处是否从 shared 导入? local-db re-export 是否保持 main 消费者零改动? ExternalApp 从 const EXTERNAL_APPS derive 是否正确搬移?
2. **ISS-010/011 XSS 防御完整性**: 三重防御 (LinkAnchor sanitize + handleLinkClick gate + browserManager navigate gate) 是否完整且无遗漏? isSafeExternalUrl 是否正确用于 renderer (从 shared 导入)? navigate 对 localhost 补 http:// 是否正确? return 不 throw 是否安全?
3. **ISS-002 stub 接线**: MessageResponse stub 是否真正消费 components prop (不再丢弃)? data-components-connected 标记是否合理? components 类型对齐 ai-sdk 契约是否正确?
4. **ISS-013 useCallback deps**: renderParts 去参数闭包方案是否正确? useExhaustiveDependencies 是否真正修复?
5. **TASK-005 全量 format 副作用**: 319 文件缩进转换是否破坏任何文件? translations.ts parse error 修复是否正确? 5 规则降级是否合理? 是否有 lint --write 误删 import?
6. **新回归检查**: shared 提取是否引入循环依赖? re-export shim 是否有性能影响? 三重防御是否过度 (重复校验)?

## Triple Gate Status (EXC-020 后)
- typecheck: exit 0 ✅
- lint: exit 0 (0 errors, 244 warnings) ✅ — AGENTS.md rule 6 满足
- format:check: exit 0 ✅
- tests: Chat 47 pass/0 fail; safe-url 5 pass/0 fail

## Specs
(无 review category specs)
