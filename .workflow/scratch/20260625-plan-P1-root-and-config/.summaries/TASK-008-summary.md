# Task: TASK-008 创建 bunfig.toml + .npmrc + components.json + index.d.ts

## Implementation Summary

### Files Modified
- `apps/desktop/bunfig.toml`: 从 Superset 复制，移除 xterm-env-polyfill preload，保留 test-setup.ts，添加 [test.env] 配置
- `apps/desktop/.npmrc`: 直接复制 Superset 版本（含 electron-builder 注释和 shamefully-hoist=true）
- `apps/desktop/components.json`: 从 Superset 复制，aliases 路径从 `renderer/...` 调整为 `src/renderer/...`，保留 shadcn/ui new-york 风格 + lucide 图标库
- `apps/desktop/index.d.ts`: 直接复制 Superset 版本，包含 vite/client 引用、ImportMetaEnv、webview JSX 声明

### Content Changed Detail

| File | Superset Original | Maestro Adapted |
|------|-------------------|-----------------|
| bunfig.toml | preload = ["./src/main/terminal-host/xterm-env-polyfill.ts", "./test-setup.ts"] | preload = ["./test-setup.ts"] |
| .npmrc | 直接复制 | 完全一致 |
| components.json | aliases: "renderer/components" etc. | aliases: "src/renderer/components" etc. |
| index.d.ts | 直接复制 | 完全一致 |

## Verification Results
- [x] `grep -c 'shamefully-hoist=true' .npmrc` = 1
- [x] `grep -c 'test-setup' bunfig.toml` = 1 (> 0)
- [x] `grep -c 'src/renderer/components/ui' components.json` = 1
- [x] `grep -c 'webview' index.d.ts` = 1 (> 0)
- [x] components.json is valid JSON
- [x] All 4 files exist

## Status: Completed
