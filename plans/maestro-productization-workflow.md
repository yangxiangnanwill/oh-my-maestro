# Maestro 产品化工作流

这份文档用于把 Maestro-flow 包装成可视化桌面产品，同时把重复、搬运、整理类任务交给 DeepSeek、GLM 5.1 或讯飞 CodePlan，降低使用 Codex / Claude Code 的成本。

## 目标

构建 Oh My Maestro：

- Maestro-flow 继续作为执行引擎。
- Electron + React 作为桌面产品壳。
- 借鉴 Superset 的 dashboard、chart、dataset、explore 等产品概念。
- MVP 阶段不嵌入 Superset runtime，避免被 Superset 后端、权限、数据源和前端体系拖住。

## 分工原则

Codex / Claude Code 负责高风险工作：

- 架构边界。
- Electron 主进程和 IPC 安全。
- TypeScript 类型和数据模型。
- 关键代码实现。
- 最终 review。

DeepSeek / GLM 5.1 / 讯飞 CodePlan 负责低风险重复工作：

- 从 CLI help 中提取命令元数据。
- 把文档和命令说明整理成 JSON。
- 生成 UI 文案草案。
- 总结 Superset 的产品概念。
- 生成 mock 数据和 parser fixture。
- 在已有接口约束下搬运简单组件。

## 输入范围

- Maestro-flow 源码：`D:\WorkSpace\Source\maestro-flow`
- 当前桌面壳：`apps/desktop`
- 当前分支：`rebuild/maestro-visual-shell`
- 产品形态：Electron + React desktop app
- 引擎入口：Electron main process 通过本机 `maestro` CLI 调用

## Phase 1：命令清单和 Command Registry

目标：建立结构化命令注册表，避免 UI 按钮到处硬编码命令。

Codex / Claude Code 负责：

- 定义 `CommandDefinition` TypeScript 接口。
- 设计 IPC 命令白名单。
- 审核低成本模型生成的命令条目。
- 把通过审核的 registry 接到 UI。

低成本模型负责：

- 整理这些命令输出：
  - `maestro --help`
  - `maestro ralph --help`
  - `maestro search --help`
  - `maestro load --help`
- 输出命令条目字段：
  - `id`
  - `label`
  - `category`
  - `args`
  - `description`
  - `outputKind`
  - `riskLevel`

建议接口：

```ts
export interface CommandDefinition {
	id: string;
	label: string;
	category: "workflow" | "ralph" | "knowledge" | "project" | "debug";
	args: string[];
	description: string;
	outputKind: "text" | "json" | "state" | "table";
	riskLevel: "read" | "write" | "destructive";
}
```

停止点：

- 只生成 registry 草案。
- 不接 UI。
- 不改 IPC。
- 不允许 write / destructive 命令进入可执行白名单。

## Phase 2：Workflow 状态模型

目标：把 Maestro-flow 的文件和 CLI 输出规范成 UI 可消费的数据模型。

Codex / Claude Code 负责：

- 定义状态模型。
- 编写 parser。
- 处理缺失文件、坏 JSON、空状态等边界情况。
- 添加必要测试。

低成本模型负责：

- 收集样例输出。
- 标注字段含义。
- 生成 fixture 草案。

建议模型：

- `WorkflowProject`
- `WorkflowRun`
- `CommandChain`
- `RalphSession`
- `KnowledgeSearchResult`

停止点：

- `.workflow/state.json`、`status.json`、`chains/singles/status.json` 都有处理策略。
- 缺失状态显示为“未初始化”或“暂无数据”，不是 raw `ENOENT`。

## Phase 3：Superset 概念映射

目标：借 Superset 的产品抽象，不继承 Superset runtime 的复杂度。

Codex / Claude Code 负责：

- 判断哪些概念应该进入 MVP。
- 保持 Oh My Maestro 独立于 Superset 后端。
- 拒绝会拖慢 MVP 的 runtime 集成。

低成本模型负责：

- 总结 Superset 概念：
  - dashboard
  - chart
  - dataset
  - explore
  - saved query
  - filter state
- 映射到 Oh My Maestro 产品概念。

推荐映射：

| Superset 概念 | Oh My Maestro 等价概念 |
| --- | --- |
| Dashboard | 工作区总览 |
| Chart | Workflow widget |
| Dataset | 命令输出数据源 |
| Explore | 命令输出探索器 |
| Saved query | 保存的命令预设 |
| Filter state | 项目、session、时间过滤 |

停止点：

- 只形成概念映射。
- MVP 不引入 Superset runtime。

## Phase 4：产品面板 MVP

目标：把当前最小壳打磨成可用的产品工作台。

初版面板：

- Command Center：基于 registry 的命令入口。
- Ralph Panel：`session`、`check`、`skills`、`next`。
- Knowledge Panel：`search`、`load`。
- Workflow State Panel：项目状态和 chain 状态。
- Visualization Panel：timeline、DAG、cards、table。

Codex / Claude Code 负责：

- 组件边界。
- 状态管理。
- IPC / tRPC 形状。
- loading、error、empty state。

低成本模型负责：

- UI 文案草案。
- mock 数据。
- 表格列设计。
- 空状态文案。

停止点：

- 面板能用 mock 或 live CLI output 渲染。
- `bun run typecheck` 和 `bun run build` 通过。

## Phase 5：Review、测试和合并

Codex / Claude Code 负责：

- 跑 `bun run typecheck`。
- 跑 `bun run build`。
- 给 parser 和 registry 加必要测试。
- Review 生成代码是否突破安全边界。
- 决定何时 merge 回主 worktree。

低成本模型负责：

- 草拟测试用例。
- 生成 fixture。
- 汇总手工 QA 步骤。

最终停止条件：

- Renderer 不直接执行 shell。
- Main process 只执行白名单命令。
- Command Registry 管住所有 UI 命令。
- Workflow / Ralph / Knowledge 至少有一版可视化面板。
- 不引入 Superset runtime。
- `typecheck` 和 `build` 通过。
- 没有未提交变更。

## 给低成本模型的固定 Prompt

把下面内容复制给 DeepSeek、GLM 5.1 或讯飞 CodePlan：

```text
你正在为 Oh My Maestro 整理结构化数据。

不要做架构设计。
不要修改 IPC。
不要修改 Electron main process。
不要实现功能代码。

输入：
- Maestro CLI help 输出，或 Maestro-flow 文档。

任务：
- 提取命令或产品元数据。
- 只返回 JSON 或 TypeScript object literal。
- 不确定的字段填 null。
- 对写入类或危险命令标记 riskLevel: "write" 或 "destructive"。

输出格式：
{
  "commands": [
    {
      "id": "string",
      "label": "string",
      "category": "workflow|ralph|knowledge|project|debug",
      "args": ["string"],
      "description": "string",
      "outputKind": "text|json|state|table",
      "riskLevel": "read|write|destructive",
      "notes": "string|null"
    }
  ]
}
```

## 常用 Maestro 命令

编码或 review 前先跑：

```powershell
maestro search "command registry"
maestro search "workflow visualization"
maestro load --type spec --category arch
maestro load --type spec --category coding
```

当前引擎验证命令：

```powershell
maestro ralph session
maestro ralph check
maestro ralph skills
maestro search "Maestro-flow"
```

