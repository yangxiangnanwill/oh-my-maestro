# Analysis: Phase 1 — CLI 嵌入

**Artifact ID**: ANL-009
**Date**: 2026-06-23
**Scope**: Micro (Phase 1, Milestone F1)
**Mode**: Quick (focused decision extraction)

## Executive Summary

**判断：GO — Phase 1 高可行性，低风险**

Phase 1 的目标是让 Maestro-flow CLI (`maestro` 命令) 在 Superset 终端面板中可执行。Superset 已有完善的自定义 Agent 系统和终端基础设施，只需将 Maestro-flow 注册为新的 Agent 类型。

### 核心发现

**集成点清晰：**
1. Superset 的 `createCustomAgent` tRPC mutation 支持注册自定义 Agent（`kind: "terminal"`）
2. `AgentLaunchConfig` 接口支持任意 CLI 命令
3. xterm.js + node-pty 已在 Windows 上可用（Phase 0 已验证 ConPTY 支持）
4. Maestro-flow 已安装为 npm 全局包（`maestro` CLI 可用）

**集成策略：**
- 方案 A: 使用 Custom Agent API 注册 Maestro-flow（Phase 1 推荐）
- 方案 B: 将 Maestro-flow 添加为内置 Agent type（Phase 2-3 目标）

## 六维评分

### 1. Feasibility（可行性）: 4/5

**证据：**
- Superset Custom Agent API 已支持任意 terminal 命令（`createCustomAgentInputSchema`）
- `agent-launch-command.ts` 支持自定义 command + args + env
- xterm.js 终端渲染已工作（Phase 0 验证）
- Maestro-flow 在 Windows 上可运行（Node.js 22 环境）
- `findBinaryPathsWindows()` 已可用（Phase 0 验证）

**Confidence**: 85%

### 2. Impact（影响）: 5/5

Phase 1 是融合路线图的第一个价值交付点 — 用户第一次在 Superset 中执行 Maestro-flow 命令。

**Confidence**: 95%

### 3. Risk（风险）: 2/5 (低风险)

**主要风险：**
- node-pty 子进程管理可能遇到 Windows ConPTY 边界情况
- Maestro-flow 的一些命令可能需要交互式输入（与 xterm.js 兼容性）

**缓解：**
- Phase 0 已确认 node-pty 1.1.0 支持 Windows ConPTY
- Maestro-flow 的主要命令（search、ralph skills、spec load）都是非交互式

**Confidence**: 80%

### 4. Complexity（复杂度）: 2/5 (低复杂度)

**集成步骤：** ~5 个关键修改点
1. Agent Preset 注册 → 添加 Maestro-flow 为 preset agent
2. 命令配置 → command: "maestro", args: [...]
3. 终端集成测试 → 验证命令输出在 xterm.js 中正确渲染
4. 环境变量传递 → MAESTRO_HOME 等路径配置
5. 命令兼容性测试 → 验证核心 maestro 子命令可执行

**Confidence**: 85%

### 5. Dependencies（依赖）: 2/5 (低依赖)

**外部依赖：**
- Maestro-flow npm 包（已安装）
- Node.js 18+（已有 v22.21.1）
- xterm.js（Superset 已包含）

**Confidence**: 85%

### 6. Alternatives（替代方案）: 已评估

| 方案 | 描述 | 评分 |
|------|------|------|
| A. Custom Agent API | 通过 tRPC `createCustomAgent` 注册 | 推荐 ✓ |
| B. 内置 Agent Wrapper | 创建 `agent-wrappers-maestro.ts` 原生支持 | Phase 3 目标 |
| C. 手动终端执行 | 用户在终端中直接输入 `maestro` 命令 | 回退方案 |

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

Phase 1 是最小可行集成 — 利用 Superset 已有的 Custom Agent API，将 Maestro-flow CLI 注册为可用的 Agent 类型。范围控制在 5 个修改点以内。

### scope_verdict: **small**

理由：主要利用现有 API + 配置，少量代码修改。单文件范围（agent preset 注册），可独立验证。

**建议下游链路：** `/maestro-plan 1` 直接进入规划执行
