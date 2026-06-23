# Analysis: Phase 0 — Environment Bootstrap

**Artifact ID**: ANL-008
**Date**: 2026-06-22
**Scope**: Micro (Phase 0, Milestone F1)
**Mode**: Quick (focused decision extraction)

## Executive Summary

**判断：GO — Phase 0 可行且必要**

Phase 0 是融合路线图的起点，包含两个关键任务：
1. **Windows 平台兼容性修复** — 让 Superset 在 Windows 上可构建运行
2. **oh-my-maestro 归档** — 提取概念翻译层设计文档后删除

### 关键发现

**好消息：**
- ✅ Bun 1.3.13 已在 Windows 上安装运行
- ✅ Node.js v22.21.1 可用
- ✅ electron-builder 已配置 Windows NSIS installer target
- ✅ 代码中已有 `process.platform === "win32"` 条件分支（22+ 处）
- ✅ macOS 专属依赖（`@superset/macos-process-metrics`）有 try/catch 优雅降级
- ✅ `node-pty` 1.1.0 支持 Windows ConPTY
- ✅ Agent setup utils 已有 `findBinaryPathsWindows()` 函数
- ✅ oh-my-maestro 概念翻译层（`translations.ts`）结构清晰，易于提取

**需要修复：**
- ❌ 无 root `package.json` — 依赖 Bun workspace 隐式解析
- ❌ `bun.lock` 不存在 — 需要 `bun install` 生成
- ❌ 系统字体路径硬编码 macOS 路径（`/System/Library/Fonts`）
- ❌ Shell 默认为 zsh/bash，Windows 需适配 PowerShell/CMD
- ❌ macOS 特定功能（Apple Events、Dock Icon、Tray）需条件跳过
- ❌ `setup.local.sh` 使用 bash 脚本，Windows 需替代方案

## 六维评分

### 1. Feasibility（可行性）: 4/5

**证据：**
- 代码中已有 22+ 处 `process.platform` 条件分支，跨平台意识存在
- `node-pty` 1.1.0 原生支持 Windows ConPTY
- Electron 40 支持 Windows 10+
- 关键 macOS 依赖已用 try/catch 保护

**挑战：**
- `setup.local.sh` 是 bash 脚本，需改写为跨平台脚本或 PowerShell
- 系统字体路径需 Windows 适配

**Confidence**: 80%

### 2. Impact（影响）: 5/5

**关键性：** Phase 0 是所有后续 Phase 的前置条件。没有 Windows 兼容性，整个融合路线图无法推进。

**Confidence**: 95%

### 3. Risk（风险）: 2/5 (低风险)

**主要风险：**
- Bun workspace 在 Windows 上的行为可能与 macOS 不同
- `node-pty` 的 ConPTY 实现可能有边界情况
- Electron 原生模块编译可能遇到 Windows 工具链问题

**缓解：**
- Bun 1.3.x 已有稳定的 Windows 支持
- ConPTY 从 Windows 10 1809+ 开始可用
- 可使用 `windows-build-tools` 或 Visual Studio Build Tools

**Confidence**: 75%

### 4. Complexity（复杂度）: 2/5 (低复杂度)

**工作量估算：**
- Windows 构建修复：~10-15 个文件修改
- Shell 适配：~5 个文件
- 字体路径适配：~3 个文件
- oh-my-maestro 归档：~2 个操作
- 总计：~20-25 个变更点

**Confidence**: 85%

### 5. Dependencies（依赖）: 2/5 (低依赖)

**外部依赖：**
- Visual Studio Build Tools（node-gyp 编译原生模块）
- Docker Desktop（可选，用于本地开发环境）
- Caddy（可选，Windows 版本可用）

**Confidence**: 80%

### 6. Alternatives（替代方案）: 已评估

| 方案 | 描述 | 评分 |
|------|------|------|
| A. 直接修复 Windows 兼容性 | 修改 Superset 源码，添加 Windows 分支 | 推荐 ✓ |
| B. WSL2 绕过 | 在 WSL2 中运行 Superset，Windows 仅做 UI | 性能损失、体验差 |
| C. 放弃 Windows | 仅支持 macOS，更换开发环境 | 不可行（用户约束） |

## 风险矩阵

```
影响 ↑
  5 |  ·  ·  ·  ·  ·
  4 |  ·  ·  ·  ·  ·
  3 |  ·  ·  🟢  ·  ·
  2 |  🟢  🟢  ·  ·  ·
  1 |  ·  ·  ·  ·  ·
    +------------------→ 概率
      1  2  3  4  5

🟢 低风险：所有已识别风险
```

## Go/No-Go Recommendation

**判断：GO**

Phase 0 是低风险、高必要性的基础步骤。代码库已有跨平台意识，修复范围可控。

### scope_verdict: **small**

理由：单项目内 20-25 个变更点，集中在 apps/desktop，无跨系统依赖。

**建议下游链路：** `/maestro-plan 0` 直接进入规划执行
