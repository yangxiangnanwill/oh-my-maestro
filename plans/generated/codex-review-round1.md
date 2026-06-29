# Codex Review: Round 1 产物

> **Review 来源**: Codex (maestro delegate --to codex --role review --mode analysis)
> **执行 ID**: gem-review-round1
> **审查文件**: command-registry-draft.md, superset-concept-mapping.md, round-1-review-notes.md
> **交叉验证**: 同步读取了 maestro-mcp-provider.ts、maestro/index.ts、CommandPalette.tsx、preload/index.ts、main/index.ts

## Verdict 摘要

| 审查点 | Verdict | 核心理由 |
|--------|---------|---------|
| 接口安全性 | ✅ APPROVE_WITH_CONCERNS | riskLevel/outputKind 方向正确；args 应为参数 schema 而非 string[]；id 改 kebab-case 需兼容旧 catalog |
| MVP read-only 边界 | ✅ APPROVE_WITH_CONCERNS | 边界方向正确；但 read 命令清单有矛盾（quality-retrospective 标 write 却放进 read）；ralph-next 必须保持 write |
| Registry 数据源 | 🔀 HYBRID | 静态白名单为准 + 动态发现只补充候选；直接 dynamic 安全风险过高 |
| Round 2 方向 | 🅰️ 方案 A | 只做 typed registry + read-only commands.list + 选择 UI，不打通执行 |
| Catalog 迁移 | 🔄 PARALLEL | 不直接 replace，并行引入新 registry，逐步共享 |
| Parser Model Round 2 | ❌ NO | 不做 parser model，最多预留 outputKind 和 dataset 关联字段 |

## 详细审查

### 1. 接口安全性 (APPROVE_WITH_CONCERNS)

**安全**: `riskLevel` 和 `outputKind` 是必要元数据字段。

**需关注**:
- `args: string[]` 仍是模板字符串，不是参数 schema。Round 2 保持 string[]，Round 3 再考虑 Zod 参数定义
- `id` 从 snake_case (`maestro_search`) 改为 kebab-case (`knowledge-search`)，需要兼容旧 catalog。建议 Round 2 新 registry 用 kebab-case，但 `commands.list` 返回时保留 `cliCommand` 字段映射回 snake_case
- `outputKind: "stream"` 可保留为 metadata，Round 2 不实现 stream 执行

### 2. MVP read-only 边界 (APPROVE_WITH_CONCERNS)

**正确方向**: 只暴露 riskLevel=read 是安全边界。

**需修正**:
- `quality-retrospective` 在命令表中标记为 write（会写入 spec/knowhow），不应出现在 read 清单
- `ralph-next` 必须保持 write（它写 status.json），不能降级为 read
- 实际 read 命令数量需重新清点，去掉矛盾项后约 18 个

### 3. Registry 数据源 (HYBRID)

**推荐**: 静态白名单为准，动态发现只补充候选（仅展示，不自动加入可执行列表）

**理由**:
- 当前 `getMaestroToolCatalog()` 返回静态目录，MCP discovery 会替换 `state.tools` 但 fallback 仍是静态
- 直接 dynamic 会让安全边界依赖 CLI 输出，风险过高
- Round 2 先用静态，Round 4+ 再引入 dynamic 补充

### 4. Round 2 方向 (方案 A)

**确认**: 只做 typed registry + read-only `commands.list` + 选择 UI

**关键原因**:
- CommandPalette 调用不存在的 `window.electronAPI`，preload 实际暴露 `window.maestro`
- `maestro:run` IPC handler 可执行任意 args，未接 registry 白名单
- 执行通道需要安全 review 后才能打通

### 5. Catalog 迁移 (PARALLEL)

**策略**: 不直接 replace，并行运行

- 新 registry 引入新的 TypeScript 接口和静态常量
- 旧 `MAESTRO_TOOL_CATALOG` 继续服务 MCP fallback
- 逐步让 `commands.list` tRPC procedure 和 MCP provider 共享同一 read-only registry

### 6. Parser Model (NO)

**Round 2 不做 parser model**

- Superset 概念映射可接受，但只作为产品语言参考
- Dataset schema 和文本 parser 留到 Round 3
- Round 2 最多预留 `outputKind` 字段和将来 dataset 关联字段

## Round 2 执行清单（基于 Review 裁定）

1. 定义 `CommandDefinition` TypeScript 接口（含 riskLevel, outputKind, id 用 kebab-case）
2. 编写静态 `COMMAND_REGISTRY` 常量（仅 read 命令，约 18 个）
3. 更新 `commands.list` tRPC procedure 从新 registry 返回
4. CommandPalette 从 registry 渲染可选择命令（不接执行）
5. 旧 `MAESTRO_TOOL_CATALOG` 保持不变（并行运行）
6. `bun run typecheck` + `bun run build` 通过
