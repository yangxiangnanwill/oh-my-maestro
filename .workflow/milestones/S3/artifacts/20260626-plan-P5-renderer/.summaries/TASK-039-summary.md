# Task: TASK-039 Wave 1: 入口基础层 — assets + globals.css + env.d.ts + env.renderer.ts

## Implementation Summary

### Files Modified
- `apps/desktop/src/renderer/assets/`: 从 Superset 源完整复制品牌图标资源目录
- `apps/desktop/src/renderer/assets/app-icons/`: 28 个 IDE/终端图标文件
- `apps/desktop/src/renderer/assets/icons/`: 图标资源子目录
- `apps/desktop/src/renderer/assets/stripe-link.png`: Stripe 链接图标
- `apps/desktop/src/renderer/globals.css`: 从 Superset 源复制完整全局样式（TailwindCSS v4 + CSS 变量主题 + xterm 样式 + 滚动条样式）
- `apps/desktop/src/renderer/env.d.ts`: 从 Superset 源复制 Vite 环境类型声明
- `apps/desktop/src/renderer/env.renderer.ts`: 从 Superset 源复制并清理渲染进程环境变量 schema

### Content Added
- **assets/** (`apps/desktop/src/renderer/assets/`): 品牌图标资源目录，包含 `app-icons/`（28 个图标文件）、`icons/`、`stripe-link.png`
- **globals.css** (`apps/desktop/src/renderer/globals.css`): 310 行全局样式文件，包含 TailwindCSS v4 `@import`、CSS 变量主题系统（暗色/亮色双模式）、xterm 终端样式、自定义滚动条样式、CSS Custom Highlight API、Tiptap 编辑器样式、Electron drag region 工具类
- **env.d.ts** (`apps/desktop/src/renderer/env.d.ts`): Vite 客户端类型引用 `/// <reference types="vite/client" />`
- **env.renderer.ts** (`apps/desktop/src/renderer/env.renderer.ts`): 渲染进程环境变量 schema，使用 zod/v4 验证，包含 NODE_ENV、NEXT_PUBLIC_API_URL、NEXT_PUBLIC_WEB_URL、NEXT_PUBLIC_MARKETING_URL、NEXT_PUBLIC_ELECTRIC_URL

### Content Removed (from env.renderer.ts)
- `RELAY_URL` 字段（Superset Relay 服务 URL）
- `NEXT_PUBLIC_POSTHOG_KEY` 字段（PostHog 分析密钥）
- `NEXT_PUBLIC_POSTHOG_HOST` 字段（PostHog 服务地址）
- `SENTRY_DSN_DESKTOP` 字段（Sentry 错误追踪 DSN）

## Outputs for Dependent Tasks

### Available Components
```typescript
// 环境变量（在 renderer 进程中使用）
import { env } from './env.renderer';
// env.NODE_ENV, env.NEXT_PUBLIC_API_URL, env.NEXT_PUBLIC_WEB_URL, etc.
```

### Integration Points
- **globals.css**: 需要在 `index.tsx` 或 `index.html` 中导入（`import './globals.css'`）
- **env.renderer.ts**: 渲染进程中的环境变量访问入口，通过 `import { env } from './env.renderer'` 使用
- **assets/app-icons/**: 被组件引用的 IDE/终端品牌图标，路径如 `assets/app-icons/vscode.svg`
- **CSS 变量主题**: 组件通过 `var(--background)`, `var(--primary)` 等 CSS 变量使用主题色

### Known Considerations
- `globals.css` 中的 `@source "../../../../packages/ui/src/**/*.{ts,tsx}"` 路径可能引用不存在的 packages/ui 目录，后续可能需要调整
- `--superset-terminal-font-family` CSS 变量名保留（品牌统一时再改）
- globals.css 引用了 `streamdown/styles.css` 和 `tw-animate-css`，需要确保这些依赖已安装

## Status: Done

### Verification Results
- [x] `test -d apps/desktop/src/renderer/assets/ && test -f apps/desktop/src/renderer/assets/app-icons/vscode.svg`
- [x] `grep '@import "tailwindcss"' apps/desktop/src/renderer/globals.css`
- [x] `grep '--background:' apps/desktop/src/renderer/globals.css`
- [x] `grep 'vite/client' apps/desktop/src/renderer/env.d.ts`
- [x] `grep 'envSchema' apps/desktop/src/renderer/env.renderer.ts`
- [x] `! grep -r 'RELAY_URL\|POSTHOG\|SENTRY_DSN' apps/desktop/src/renderer/env.renderer.ts`
- [x] `[UI-observable] 复制后项目结构完整：assets/、globals.css、env.d.ts、env.renderer.ts 均存在于 apps/desktop/src/renderer/`
