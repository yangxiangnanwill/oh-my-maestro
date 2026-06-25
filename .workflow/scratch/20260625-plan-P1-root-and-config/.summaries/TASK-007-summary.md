# Task: TASK-007 改造 package.json — Desktop 包配置

## Implementation Summary

改造 `apps/desktop/package.json`，将其从基础配置转换为完整的 Electron 桌面应用包配置。

### Files Modified
- `D:/WorkSpace/VsCode/oh-my-maestro/apps/desktop/package.json`: 大幅改造，更新所有字段

### Changes Made

#### 元数据字段
- **name**: `@oh-my-maestro/desktop` (保持)
- **productName**: `Maestro` (新增)
- **description**: `Maestro Desktop — Maestro-flow IDE with AI orchestration` (更新)
- **main**: `./dist/main/index.js` (更新为 electron-vite 输出路径)
- **resources**: `src/resources` (新增，electron-builder 需要)
- **repository**: `{ type: 'git', url: 'https://github.com/yangxiangnanwill/oh-my-maestro.git' }` (新增)
- **author**: `{ name: 'Maestro', email: 'maintainers@oh-my-maestro.dev' }` (新增)

#### Scripts (替换为 electron-vite 构建脚本)
- `dev`: `electron-vite dev --watch`
- `build`: `electron-vite build`
- `preview`: `electron-vite preview`
- `package`: `electron-builder --config electron-builder.ts`
- `typecheck`: `tsc --noEmit`
- `test`: `bun test`
- `clean`: `rimraf dist dist-electron release .turbo`

#### Dependencies (92 个，精确版本号来自 Superset 参考)
按需筛选，保留 Maestro 源码实际引用的依赖：
- **AI SDK**: `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/react`, `ai`, `@mastra/core`
- **React**: `react`, `react-dom`, `react-hook-form`, `@hookform/resolvers`, `react-hotkeys-hook`, `react-markdown`, `react-resizable-panels`, `framer-motion`
- **Routing/Data**: `@tanstack/react-query`, `@tanstack/react-router`, `@tanstack/react-table`, `@tanstack/react-virtual`
- **IPC**: `@trpc/client`, `@trpc/react-query`, `@trpc/server`, `trpc-electron`
- **Editor**: `@codemirror/*` (9 packages)
- **Terminal**: `@xterm/xterm`, `@xterm/addon-fit`, `@xterm/addon-serialize`, `@xterm/headless`, `node-pty`, `tree-kill`, `default-shell`, `shell-quote`, `strip-ansi`, `os-locale`
- **UI**: `@radix-ui/react-dialog`, `@radix-ui/react-label`, `@dnd-kit/*` (3 packages), `@headless-tree/*` (2 packages), `lucide-react`, `tailwind-merge`, `clsx`, `culori`
- **Database**: `better-sqlite3`, `drizzle-orm`, `lowdb`
- **Electron**: `electron-log`, `electron-updater`
- **Native modules**: `@ast-grep/napi`, `@parcel/watcher`, `native-keymap`, `bindings`, `file-uri-to-path`, `detect-libc`, `node-addon-api`
- **Validation**: `zod`, `@t3-oss/env-core`
- **Markdown**: `rehype-raw`, `rehype-sanitize`, `remark-gfm`, `shiki`
- **MCP**: `@modelcontextprotocol/sdk`
- **Diff**: `@pierre/diffs`
- **Host**: `@hono/node-server`
- **Mermaid**: `@streamdown/mermaid`
- **Syntax**: `@lezer/highlight`
- **Utils**: `nanoid`, `superjson`, `semver`, `date-fns`, `fuse.js`, `simple-git`, `dotenv`, `uuid`

#### DevDependencies (19 个)
- **Build**: `electron-vite`, `electron-builder`, `electron`, `typescript`, `vite`, `@vitejs/plugin-react`, `vite-tsconfig-paths`, `rollup-plugin-inject-process-env`
- **CSS**: `tailwindcss`, `@tailwindcss/vite`
- **Router**: `@tanstack/router-cli`, `@tanstack/router-plugin`
- **Types**: `@types/better-sqlite3`, `@types/bun`, `@types/http-proxy`, `@types/lodash`, `@types/node`, `@types/react`, `@types/react-dom`, `@types/semver`, `@types/shell-quote`
- **Tools**: `rimraf`, `cross-env`, `tsx`

#### 已移除的依赖
- `@better-auth/api-key`, `@better-auth/stripe`, `better-auth`
- `@sentry/electron`, `@sentry/vite-plugin`
- `posthog-js`, `posthog-node`
- `@superset/*` (所有 workspace 依赖)
- `@electric-sql/client`, `@durable-streams/client`
- `libsql`, `@vercel/blob`
- `code-inspector-plugin`, `@superset/typescript`
- `@tanstack/db`, `@tanstack/electron-db-sqlite-persistence`, `@tanstack/node-db-sqlite-persistence`, `@tanstack/query-async-storage-persister`, `@tanstack/react-db`, `@tanstack/react-query-persist-client`, `@tanstack/electric-db-collection`
- `tiptap` 系列 (20+ packages), `tiptap-markdown`, `@tiptap/*`
- `react-dnd`, `react-dnd-html5-backend`, `dnd-core`
- `react-mosaic-component`, `react-icons`, `react-syntax-highlighter`, `tippy.js`, `use-resize-observer`
- `express`, `http-proxy`, `jose`, `dexie`, `idb-keyval`, `lodash`, `execa`
- `@codemirror/lang-cpp`, `@codemirror/lang-css`, `@codemirror/lang-go`, `@codemirror/lang-html`, `@codemirror/lang-java`, `@codemirror/lang-php`, `@codemirror/lang-rust`, `@codemirror/lang-xml`, `@codemirror/lang-yaml`, `@codemirror/legacy-modes`, `@codemirror/theme-one-dark`
- `@xterm/addon-clipboard`, `@xterm/addon-image`, `@xterm/addon-ligatures`, `@xterm/addon-progress`, `@xterm/addon-search`, `@xterm/addon-unicode11`, `@xterm/addon-webgl`
- `@paper-design/shaders-react`, `@replit/codemirror-css-color-picker`, `@pierre/trees`
- `highlight.js`, `lowlight`, `streamdown`, `mastracode`, `friendly-words`, `line-column-path`
- `pidusage`, `pidtree`, `prebuild-install`, `bufferutil`, `utf-8-validate`
- `mdast-util-to-string`, `remark-parse`, `unified`
- `material-icon-theme`, `tw-animate-css`

### Convergence Criteria Results
| # | Criterion | Result |
|---|-----------|--------|
| 1 | `@oh-my-maestro/desktop` count = 1 | PASS |
| 2 | `electron-vite` in devDeps > 0 | PASS (4 matches) |
| 3 | `electron-builder` in devDeps > 0 | PASS (2 matches) |
| 4 | `@sentry\|posthog\|@better-auth\|stripe` count = 0 | PASS |
| 5 | `productName` = `Maestro` count = 1 | PASS |
| 6 | `electron-vite dev` in scripts > 0 | PASS |

## Status: COMPLETE
