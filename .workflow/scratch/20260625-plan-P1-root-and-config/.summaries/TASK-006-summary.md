# Task: TASK-006 创建 electron-builder.ts — Electron 打包配置

## Implementation Summary

### Files Modified
- `apps/desktop/electron-builder.ts`: 从 Superset 源文件适配而来，完成 Maestro IDE 的 Electron 打包配置

### Content Added
- **appId**: `com.maestro-flow.desktop`
- **productName**: 从 `package.json` 的 `pkg.productName`（即 "Maestro"）
- **copyright**: 从 `package.json` 的 `pkg.author?.name` 动态生成
- **publish**: GitHub Releases 配置，owner: `yangxiangnanwill`, repo: `oh-my-maestro`
- **mac**: 最小化 macOS 配置（无 entitlements、无 notarize、无 NS* 权限描述）
- **linux**: AppImage 打包，artifactName: `Maestro-${version}-${arch}.${ext}`
- **win**: NSIS 安装器，artifactName: `${productName}-${version}-${arch}.${ext}`
- **protocols**: 深度链接协议 `schemes: ["maestro"]`
- **asar**: 使用 `runtime-dependencies.ts` 导出的 `packagedAsarUnpackGlobs`
- **files**: 包含 `packagedNodeModuleCopies`（runtime-dependencies.ts 存在）

### Removed from Superset Version
- `generateUpdatesFilesForAllChannels` 配置项
- `extraResources`（migrations、bin 目录）
- `dmg` 配置（DMG 安装器）
- macOS `entitlements`、`entitlementsInherit`、`notarize`
- macOS `NSMicrophoneUsageDescription`、`NSLocalNetworkUsageDescription`、`NSBonjourServices`、`NSAppleEventsUsageDescription`

## Outputs for Dependent Tasks

### Available Components
```typescript
import config from "./electron-builder";
// Configuration 类型，用于 electron-builder --config electron-builder.ts
```

### Integration Points
- **打包命令**: `bun run package` 会调用 `electron-builder --config electron-builder.ts`
- **package.json scripts**: `"package": "electron-builder --config electron-builder.ts"`
- **runtime-dependencies.ts**: 提供 `packagedNodeModuleCopies` 和 `packagedAsarUnpackGlobs`

## Status: ✅ Complete
