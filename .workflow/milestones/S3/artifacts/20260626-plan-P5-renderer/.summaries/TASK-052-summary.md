# Task: TASK-052 Chat 组件核心迁移

## Implementation Summary

### 操作
从 Superset 源复制 Chat/ 全部 187 个文件到 `apps/desktop/src/renderer/components/Chat/`，并创建 37 个 stub 文件替代 `@superset` 引用。所有 `@superset` 引用已替换为相对路径导入指向本地 stub 模块。

### Files Modified (import paths updated - 57 files)
57 个文件的 `@superset` import 引用被替换为指向 `stubs/` 目录的相对路径。

### Stubs Created (37 files)
37 个 stub 文件创建于 `apps/desktop/src/renderer/components/Chat/stubs/` 目录下，覆盖所有 `@superset` 包的导出：

- `stubs/chat/client.ts` - `chatServiceTrpc` tRPC React 客户端
- `stubs/chat/shared.ts` - `tokenizeSlashCommandArguments`, `parseNamedSlashArgumentToken`, `normalizeSlashNamedArgumentKey`, `findSlashCommandByNameOrAlias`
- `stubs/chat/server/desktop.ts` - `ChatServiceRouter` 类型
- `stubs/ui/utils.ts` - `cn()` 工具函数 (clsx + tailwind-merge)
- `stubs/ui/lib/utils.ts` - `cn()` 工具函数 (同上)
- `stubs/ui/button.tsx` - `Button` 组件
- `stubs/ui/input.tsx` - `Input` 组件
- `stubs/ui/label.tsx` - `Label` 组件
- `stubs/ui/badge.tsx` - `Badge` 组件
- `stubs/ui/checkbox.tsx` - `Checkbox` 组件
- `stubs/ui/input-group.tsx` - `InputGroup`, `InputGroupInput` 组件
- `stubs/ui/tooltip.tsx` - `Tooltip`, `TooltipTrigger`, `TooltipContent` 组件
- `stubs/ui/popover.tsx` - `Popover`, `PopoverTrigger`, `PopoverAnchor`, `PopoverContent` 组件
- `stubs/ui/dialog.tsx` - `Dialog` 系列组件
- `stubs/ui/command.tsx` - `Command` 系列组件
- `stubs/ui/dropdown-menu.tsx` - `DropdownMenu` 系列组件
- `stubs/ui/hover-card.tsx` - `HoverCard` 系列组件
- `stubs/ui/collapsible.tsx` - `Collapsible` 系列组件
- `stubs/ui/sonner.ts` - `toast` 通知函数
- `stubs/ui/icons/preset-icons.ts` - `claudeIcon` SVG data URL
- `stubs/ui/ai-elements/bash-tool.tsx` - `BashTool` 组件
- `stubs/ui/ai-elements/clickable-file-path.tsx` - `ClickableFilePath` 组件
- `stubs/ui/ai-elements/conversation.tsx` - `Conversation` 系列组件 + `useConversationContext`
- `stubs/ui/ai-elements/exploring-group.tsx` - `ExploringGroup` 组件
- `stubs/ui/ai-elements/file-diff-tool.tsx` - `FileDiffTool` 组件
- `stubs/ui/ai-elements/message.tsx` - `Message`, `MessageContent`, `MessageResponse` 组件
- `stubs/ui/ai-elements/model-selector.tsx` - `ModelSelector` 系列组件
- `stubs/ui/ai-elements/plan.tsx` - `Plan`, `PlanStep` 组件
- `stubs/ui/ai-elements/prompt-input.tsx` - `PromptInput` 系列组件 + `usePromptInputController`
- `stubs/ui/ai-elements/read-file-tool.tsx` - `ReadFileTool` 组件
- `stubs/ui/ai-elements/shimmer-label.tsx` - `ShimmerLabel` 组件
- `stubs/ui/ai-elements/task.tsx` - `TaskItem`, `TaskItemFile` 组件
- `stubs/ui/ai-elements/thinking-toggle.tsx` - `ThinkingToggle` 组件 + `ThinkingLevel` 类型
- `stubs/ui/ai-elements/tool.tsx` - `ToolInput`, `ToolOutput` 组件 + `ToolDisplayState` 类型
- `stubs/ui/ai-elements/tool-call-row.tsx` - `ToolCallRow` 组件
- `stubs/ui/ai-elements/web-fetch-tool.tsx` - `WebFetchTool` 组件
- `stubs/ui/ai-elements/web-search-tool.tsx` - `WebSearchTool` 组件

### Key Components
- **ChatInterface** (`ChatInterface/components/`) - 消息列表、输入框、模型选择器、工具调用块、斜杠命令等核心对话 UI
- **MessageList** (`ChatInterface/components/MessageList/`) - AI 消息列表渲染组件
- **ChatInputFooter** (`ChatInterface/components/ChatInputFooter/`) - 聊天输入框及附件管理
- **ModelPicker** (`ChatInterface/components/ModelPicker/`) - AI 模型选择器（含 API key 管理）
- **ToolCallBlock** (`ChatInterface/components/ToolCallBlock/`) - 工具调用结果渲染（Bash, FileDiff, WebSearch 等 20+ 种工具）
- **TiptapPromptEditor** (`ChatInterface/components/TiptapPromptEditor/`) - 基于 Tiptap 的富文本编辑器
- **SubagentInnerToolCall** (`components/SubagentInnerToolCall/`) - 子 Agent 内部工具调用渲染
- **chat-service-client** (`utils/chat-service-client.ts`) - Chat tRPC IPC 客户端

## Outputs for Dependent Tasks

### Available Components
```typescript
// Chat components ready for import/use
import { ChatInputFooter } from "renderer/components/Chat/ChatInterface/components/ChatInputFooter";
import { MessageList } from "renderer/components/Chat/ChatInterface/components/MessageList";
import { ModelPicker } from "renderer/components/Chat/ChatInterface/components/ModelPicker";
import { ToolCallBlock } from "renderer/components/Chat/ChatInterface/components/ToolCallBlock";
import { SubagentInnerToolCall } from "renderer/components/Chat/components/SubagentInnerToolCall";
import { createChatServiceIpcClient } from "renderer/components/Chat/utils/chat-service-client";
```

### Integration Points
- **chatServiceTrpc**: tRPC React 客户端，通过 `stubs/chat/client.ts` 提供，连接到 app router 的 `chatService` 子路由
- **createChatServiceIpcClient**: 创建配置好的 chat service IPC 客户端
- **所有 UI stub**: `stubs/ui/*` 提供基础 UI 组件和 AI 元素组件的 stub 实现

### Note on Stubs
所有 stub 文件位于 `Chat/stubs/` 目录内，提供最小化实现。完整 UI 组件实现需后续从 `@superset/ui` 包迁移或替换为本地 shadcn/ui 组件。

## Status: Complete
