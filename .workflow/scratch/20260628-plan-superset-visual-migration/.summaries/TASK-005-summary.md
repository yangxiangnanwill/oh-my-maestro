# TASK-005: Chat 面板集成

## Changes
- `apps/desktop/src/renderer/routes/_authenticated/workspaces/$workspaceId/page.tsx`: 完全重写 Workspace 页面。创建 ChatPanel 组件（简化版），支持消息列表渲染、文本输入、Enter 发送。消息以 user/assistant 气泡形式展示。集成 tRPC `chatService.send` mutation 发送消息。

## Verification
- [x] Workspace 页面显示 Chat 面板: ChatPanel 组件渲染在 Split View 中
- [x] Chat 面板支持输入和发送消息: 输入框 + 发送按钮，支持 Enter 快捷发送
- [x] 消息以气泡形式展示: user 消息右对齐（accent 背景），assistant 消息左对齐（muted 背景）
- [x] tsc --noEmit 零错误: 通过

## Tests
- [x] cd apps/desktop && bun run typecheck: pass (零错误)

## Deviations
- ChatInterface 完整组件依赖过多（sessionId, organizationId, deviceId 等），使用简化版 ChatPanel 替代。完整集成留待 Phase 5。

## Notes
- ChatPanel 使用 useState 管理本地消息状态
- 发送消息时调用 `electronTrpc.chatService.send.useMutation()`
- 包含 Loading（思考中...）和 Error 状态处理
- Chat 面板标题栏显示 workspaceId
