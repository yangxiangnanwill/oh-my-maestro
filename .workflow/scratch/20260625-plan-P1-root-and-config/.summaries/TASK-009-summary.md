# Task: TASK-009 创建 runtime-dependencies.ts + RELEASE.md + BUILDING.md + create-release.sh + electron-builder.canary.ts

## Implementation Summary

### Files Modified
- `D:/WorkSpace/VsCode/oh-my-maestro/apps/desktop/runtime-dependencies.ts`: 从 Superset 版本精简，保留 6 个实际使用的原生模块，移除 @superset/macos-process-metrics 和 @mastra/duckdb
- `D:/WorkSpace/VsCode/oh-my-maestro/apps/desktop/RELEASE.md`: 从 Superset 版本复制，替换所有品牌名和仓库地址引用
- `D:/WorkSpace/VsCode/oh-my-maestro/apps/desktop/BUILDING.md`: 从 Superset 版本复制，替换构建命令路径引用
- `D:/WorkSpace/VsCode/oh-my-maestro/apps/desktop/create-release.sh`: 从 Superset 版本复制，替换 tag 命名（desktop-v -> maestro-desktop-v），替换仓库地址，移除 host-service bump 逻辑
- `D:/WorkSpace/VsCode/oh-my-maestro/apps/desktop/electron-builder.canary.ts`: 从 Superset 版本复制，替换 appId/productName/publish owner/repo/artifactName

### Content Added
- **libsql 模块配置** (`runtime-dependencies.ts:61-70`): 新增 libsql 原生模块的外部化配置（含 @libsql、@neon-rs 依赖复制）
- **is-glob/is-extglob/picomatch 支持模块** (`runtime-dependencies.ts:72-80`): 新增 @parcel/watcher 的间接依赖支持模块
- **maestro-desktop-v tag 命名** (`create-release.sh`): 全局替换 desktop-v -> maestro-desktop-v 用于 release tag
- **Maestro Canary 品牌标识** (`electron-builder.canary.ts`): appId: com.maestro-flow.desktop.canary, productName: Maestro Canary, artifactName 包含 Maestro 标识
- **完整 release 流程** (`create-release.sh`): 交互式版本选择、PR 创建、workflow 监控、draft/publish 控制

## Convergence Verification

| # | Criterion | Result |
|---|-----------|--------|
| 1 | grep -c 'better-sqlite3' runtime-dependencies.ts > 0 | PASS (4 matches) |
| 2 | grep -c '@superset/macos-process-metrics' runtime-dependencies.ts = 0 | PASS (0 matches) |
| 3 | grep -c 'oh-my-maestro' RELEASE.md > 2 | PASS (4 matches) |
| 4 | grep -c 'maestro-desktop-v' create-release.sh > 0 | PASS (6 matches) |
| 5 | grep -c 'com\.maestro-flow\.desktop\.canary' electron-builder.canary.ts > 0 | PASS (1 match) |
| 6 | grep -c 'superset-sh\|superset\.sh' RELEASE.md BUILDING.md = 0 | PASS (0 matches) |

## Outputs for Dependent Tasks

### Available Components
```typescript
// runtime-dependencies.ts exports
export const mainExternalizedDependencies: string[];
export const packagedNodeModuleCopies: PackagedNodeModuleCopy[];
export const packagedAsarUnpackGlobs: string[];
export const requiredMaterializedNodeModules: string[];

// electron-builder.canary.ts default export
export default config; // Configuration (electron-builder)
```

### Integration Points
- **runtime-dependencies.ts**: 被 `electron-builder.ts` 和 `electron-builder.canary.ts` 导入，提供原生模块打包配置
- **create-release.sh**: 在 monorepo 根目录执行，创建 `maestro-desktop-v*` tag 触发 GitHub Actions release workflow
- **RELEASE.md / BUILDING.md**: 开发文档，描述发布流程和本地构建步骤
- **electron-builder.canary.ts**: 通过 `bun run package -- --config electron-builder.canary.ts` 使用

### Notable Adaptations from Superset
- 移除 `bump_host_service_patch()` 函数及所有 host-service 引用（oh-my-maestro 无此包）
- worktree 临时目录前缀从 `superset-release-` 改为 `maestro-release-`
- 发布下载链接从 `Superset-arm64.dmg` / `Superset-x64.AppImage` 改为 `Maestro-arm64.dmg` / `Maestro-x64.AppImage`
- Canary 协议 scheme 从 `superset-canary` 改为 `maestro-canary`（已在 base config 继承）

## Status: COMPLETE
