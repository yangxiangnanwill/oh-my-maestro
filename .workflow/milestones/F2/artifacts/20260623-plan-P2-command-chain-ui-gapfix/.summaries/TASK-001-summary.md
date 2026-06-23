# TASK-001: 挂载 TranslationProvider 到 RootLayout

## Changes
- `D:/WorkSpace/GitRepoes/superset/apps/desktop/src/renderer/routes/-layout.tsx`: 添加 `import { TranslationProvider } from "renderer/contexts/TranslationContext";`，将 `{children}` 包裹为 `<TranslationProvider>{children}</TranslationProvider>`，位于 AuthProvider 内部

## Verification
- [x] grep -l "TranslationProvider" 返回匹配: 通过
- [x] grep -c "from \"renderer/contexts/TranslationContext\"" 返回 >=1: 通过 (计数=1)
- [x] `<TranslationProvider>` 在 AuthProvider 内部、children 外部: 通过 (第 19-23 行确认嵌套结构)
- [x] grep "TranslationProvider" 全局文件列表包含 -layout.tsx: 通过

## Tests
- [x] `bun test --grep TranslationContext`: 跳过 — 项目缺少 test-setup.ts preload 配置，非本次修改引入

## Deviations
- TypeScript 编译检查 (`tsc --noEmit`) 无法运行：项目未安装 typescript 包。修改本身是纯 import + JSX 包裹，编译安全性由 TranslationContext.tsx 中已导出的 `TranslationProvider` 函数名保证
- 收敛条件中 grep 模式使用单引号 `'renderer/contexts/TranslationContext'`，但实际文件使用双引号，使用双引号模式验证通过

## Notes
- TranslationProvider 放在 AuthProvider 内部，hydration 期间不会渲染（AuthProvider 返回 splash screen 时不渲染 children）
- ThemedToaster 和 Alerter 保持在 TranslationProvider 外部，它们不需要翻译能力
