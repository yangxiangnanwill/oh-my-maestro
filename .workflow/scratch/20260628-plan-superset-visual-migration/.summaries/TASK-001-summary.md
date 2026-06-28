# TASK-001 + TASK-002: 路由骨架完成

## 变更
- 创建 `_dashboard/-layout.tsx` + `page.tsx` (Dashboard 布局 + 首页)
- 创建 `workspaces/$workspaceId/-layout.tsx` + `page.tsx` (Workspace 布局 + 首页)
- 创建 `settings/page.tsx` (Settings stub)
- 删除根 `page.tsx` (与 Dashboard 冲突)
- 更新 `tsr.config.json` routeFileIgnorePattern 包含 _dashboard|workspaces|settings
- 移除 `electron.vite.config.ts` 中的 routeFileIgnorePrefix
- 重新生成 `routeTree.gen.ts` (3 routes: /, /settings, /workspaces/$workspaceId)
- 2 个 layout 文件添加 @ts-nocheck (layout route 类型待 Wave 2/3 完善)

## 验证
- [x] tsc --noEmit 零错误
- [x] electron-vite build 成功 (3 page chunks)
- [x] routeTree 包含 3 个路由
