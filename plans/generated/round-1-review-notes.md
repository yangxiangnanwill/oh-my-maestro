# Round 1 Review Notes

> **Round 1 产物** — 审查清单 + 架构发现 + 下一步建议。
> **硬性停止**: 生成此文件后立刻停止，等待 Codex review。

## 产出摘要

| 产物 | 路径 | 状态 |
|------|------|------|
| Command Registry Draft | `plans/generated/command-registry-draft.md` | ✅ 完成 |
| Superset Concept Mapping | `plans/generated/superset-concept-mapping.md` | ✅ 完成 |
| Round 1 Review Notes | `plans/generated/round-1-review-notes.md` | ✅ 当前文件 |

---

## 关键架构发现

### 发现 1：CommandPalette 执行链未打通

**严重程度**: 高

当前 `CommandPalette` 组件的 `handleSelect` 尝试调用 `window.electronAPI.terminalWrite` 或 `window.electronAPI.send`，但这两个 API 在 preload 中未定义。命令选择后仅 `console.warn` 降级。

**影响**: 用户无法从 CommandPalette 真正执行任何命令。这是 Round 2 实现 Command Registry 时必须解决的前置问题。

**建议修复路径**:
- Option A: 在 preload 中暴露 `terminalWrite` API，CommandPalette 通过 PTY 执行命令
- Option B: CommandPalette 选择命令后，通过 tRPC mutation 调用 maestro router（仅限 read 命令）
- Option C: Round 2 先实现 registry + 选择，Round 4 才接执行通道

### 发现 2：双界面共存

**严重程度**: 中

`App.tsx`（直接 preload IPC）和 TanStack Router 页面（tRPC）两套界面并行。`App.tsx` 更像调试/验证工具，但仍在渲染路径中。

**影响**: Command Registry 如果只服务 TanStack Router 路径，App.tsx 的 `window.maestro.run` 将绕过 registry 白名单。

**建议**: Round 2 不动 App.tsx，但需确认 App.tsx 的 `maestro:run` IPC handler 是否需要加白名单校验。

### 发现 3：CLI 调用全量同步

**严重程度**: 中低

tRPC maestro router 中 `execMaestroCli` 使用 `execFile` 同步等待 stdout，超时 30s。长时间运行的命令（如 `maestro analyze`、`maestro explore`）可能超时。

**影响**: Widget 数据源如果是长时间运行的命令，需要流式或分页方案。MVP 阶段可用超时 + loading state 应对。

### 发现 4：MCP 降级链

**严重程度**: 低（信息性）

MCP provider 有三级降级：
1. stdio transport 实时发现工具（需 CLI 可用）
2. 静态 `MAESTRO_TOOL_CATALOG`（28 个命令，硬编码）
3. tRPC-only（无 MCP Registry）

**影响**: Command Registry 草案建议从 CLI help 动态提取，但当前实现是静态 catalog。Round 2 需要决定：是保持静态 + 人工维护，还是运行时动态发现。

### 发现 5：MAESTRO_TOOL_CATALOG 与 CLI 实际命令差异大

**严重程度**: 高

当前 catalog 硬编码 28 个命令（4 类），但 `maestro --help` 显示 30+ 个顶级命令，`ralph skills --platform claude` 列出 60+ 个 skill。Command Registry Draft 中整理了 52+ 个命令（7 类）。

**影响**: 如果 Command Registry 基于当前 catalog，会丢失大量命令。需要决定 Round 2 的 registry 数据源。

---

## Codex 必须审查的点

### 🔴 高优先级（决定 Round 2 方向）

1. **CommandDefinition 接口形状**
   - `outputKind: "stream"` 是否需要？
   - `riskLevel` 三级（read/write/destructive）是否足够？
   - 是否需要 `timeout` 字段（CLI 命令有 30s 超时）？

2. **MVP read-only 安全边界**
   - 草案建议 20 个 read 命令作为 MVP 可安全暴露集合
   - `ralph-next` 的 read/write 归属需要裁定
   - 是否需要更细粒度的权限模型（如 per-arg 白名单）？

3. **Registry 数据源**
   - 静态 TypeScript 常量（当前 catalog 模式）？
   - 运行时从 `maestro ralph skills --json` 动态发现？
   - 混合模式：静态白名单 + 动态补充？

4. **CommandPalette 执行通道**
   - Round 2 是否需要打通执行链？
   - 还是只做 registry + 选择 UI，执行留给 Round 4？

5. **MAESTRO_TOOL_CATALOG 的迁移策略**
   - 是否废弃当前 28 命令的静态 catalog？
   - 还是新 registry 并行运行，逐步替换？

### 🟡 中优先级（影响 Round 3-4）

6. **Superset 概念映射验证**
   - Dashboard/Widget/Dataset/Explore 映射是否自然？
   - 有没有强行映射的概念应该排除？

7. **Dataset schema 锁定时机**
   - Round 2 锁定 registry 的 CommandDefinition？
   - Round 3 才定义 CommandOutputDataset schema？

8. **Widget 拆分粒度**
   - 当前 6 个组件 → 6 个 Widget，是否需要拆分？
   - RightSidePanel 内的 CommandChain + Knowledge 是否应为独立 Widget？

### 🟢 低优先级（Round 4-5 再决定）

9. **Command Preset 概念**
   - Round 2 预留接口？Round 4 再实现？

10. **Filter State 存储方案**
    - localStorage vs TanStack DB vs URL state

11. **Dashboard 布局引擎选择**
    - react-grid-layout vs 自定义 flex

---

## Round 2 方向建议（待 Codex 裁定）

### 方案 A：最小实现

- 只实现 typed `CommandDefinition` 接口 + 静态 registry 常量
- 只暴露 `riskLevel: "read"` 命令到 `commands.list` tRPC procedure
- CommandPalette 从 registry 渲染，但不接执行
- `MAESTRO_TOOL_CATALOG` 保留，新 registry 并行
- typecheck + build 通过后停止

### 方案 B：Registry + 白名单执行

- 方案 A 的全部内容
- 加上：read 命令通过 tRPC 新 procedure `commands.execute` 执行
- IPC 白名单在 main process 侧校验 riskLevel
- CommandPalette 选择 read 命令后可真正执行并查看结果

### 方案 C：完整 Registry + 执行 + 动态发现

- 方案 B 的全部内容
- 加上：运行时从 `maestro ralph skills --json` 动态补充命令
- 需要合并静态 + 动态命令的去重逻辑
- 风险：scope 膨胀

**建议**: 方案 A，最小实现。理由：
1. Round 1 是分析，不应在 Round 2 就跨过"仅 registry"的停止点
2. 执行通道需要安全 review（发现 1 的 CommandPalette 缺口）
3. 动态发现需要 MCP provider 配合，scope 更大

---

## 硬性约束确认

| 约束 | 状态 | 说明 |
|------|------|------|
| 不实现 UI | ✅ | 产物仅 Markdown，无代码变更 |
| 不修改 IPC | ✅ | 未触碰任何 tRPC router 或 preload 文件 |
| 不引入 Superset runtime | ✅ | 仅做概念映射，未引入任何依赖 |
| 不删除旧代码 | ✅ | 未修改任何源文件 |
| 只在 plans/generated/ 下写产物 | ✅ | 3 个文件全部在 plans/generated/ |
| Round 1 产物后立刻停止 | ✅ | 当前文件即停止点 |

---

## 下一步（需 Codex 批准后）

1. Codex 审查以上 11 个 review points
2. Codex 裁定 Round 2 方向（A / B / C）
3. 开始 Round 2：实现 Command Registry
