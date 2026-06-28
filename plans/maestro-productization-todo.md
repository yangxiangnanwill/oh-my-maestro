# Maestro 产品化执行 TODO

这份文件是你在 Claude Code、讯飞 CodePlan、DeepSeek / GLM 和 Codex 之间切换时使用的执行清单。

## 核心规则

不要一次性跑完整个流程。

每一轮只推进到指定停止点。到停止点后必须停下来，提交或汇报结果，然后回到 Codex review，再决定是否进入下一轮。

## 准备

进入 rebuild worktree：

```powershell
cd D:\WorkSpace\VsCode\oh-my-maestro-rebuild
git status
git pull
```

用 Claude Code 打开这个目录。

先让 Claude Code 读取流程：

```text
/maestro-next plans/maestro-productization-workflow.md
```

然后只执行当前轮次，不要跨轮次。

## Round 1：分析和草案

### 给 Claude Code 的 Prompt

```text
读取 plans/maestro-productization-workflow.md 和 plans/maestro-productization-todo.md。

只执行 Round 1。

目标：
- 分析当前 Electron 最小壳。
- 基于当前 Maestro CLI 用法产出 command registry 草案。
- 产出 Superset 到 Oh My Maestro 的概念映射。

硬性停止：
- 不实现 UI。
- 不修改 IPC。
- 不引入 Superset runtime。
- 不删除旧代码。
- 生成 Round 1 产物后立刻停止。

期望产物：
- plans/generated/command-registry-draft.md
- plans/generated/superset-concept-mapping.md
- plans/generated/round-1-review-notes.md

产物写完后停止，并说明需要 Codex review 哪些点。
```

### 允许做的事

- 阅读源码。
- 运行 `maestro --help`、`maestro ralph --help`、`maestro search --help`、`maestro load --help`。
- 使用 CodePlan、DeepSeek 或 GLM 提取命令元数据。
- 只在 `plans/generated/` 下写 Markdown 分析产物。

### 停止点

看到下面 3 个文件后必须停止：

- `plans/generated/command-registry-draft.md`
- `plans/generated/superset-concept-mapping.md`
- `plans/generated/round-1-review-notes.md`

### 回到 Codex review

让 Codex 检查：

- command registry 形状是否安全。
- 哪些命令适合 MVP read-only。
- Superset 映射是否避免 runtime 依赖蔓延。
- Round 2 是只实现 registry，还是同时做 parser model。

## Round 2：实现 Command Registry

只有 Codex approve Round 1 后才能开始。

### 给 Claude Code 的 Prompt

```text
读取 plans/generated/command-registry-draft.md 和 Codex review notes。

只执行 Round 2。

目标：
- 实现 typed command registry。
- 当前 quick actions 从 registry 渲染。
- IPC 白名单保持显式、安全、可 review。

硬性停止：
- 不添加 Superset runtime。
- 不添加 destructive 命令。
- 不支持任意命令参数。
- typecheck 和 build 通过后停止。

期望产物：
- apps/desktop/src/renderer/lib/commands/commands.registry.ts
- renderer quick actions 改为基于 registry 渲染
- 如确实需要，同步更新 main process validation

验证：
- cd apps/desktop
- bun run typecheck
- bun run build

验证完成后停止，并说明需要 Codex review 哪些点。
```

### 允许做的事

- 新增 typed registry 文件。
- 把现有按钮改成从 registry 渲染。
- 只为已 review 的 read-only 命令更新 IPC validation。
- 需要展示时可以加小型 helper 或 parser。

### 停止点

满足以下条件必须停止：

- `bun run typecheck` 通过。
- `bun run build` 通过。
- 没有未 review 的 write / destructive 命令暴露到 UI。

### 回到 Codex review

让 Codex 检查：

- IPC 命令白名单。
- Registry 类型设计。
- UI 行为是否和当前壳一致。
- 是否可以提交，还是需要调整。

## Round 3：Workflow 状态模型

只有 Codex approve 并提交 Round 2 后才能开始。

### 给 Claude Code 的 Prompt

```text
读取 plans/maestro-productization-workflow.md 和 Round 2 的 Codex review notes。

只执行 Round 3。

目标：
- 定义 typed workflow state model。
- 解析 Maestro-flow 当前可用的 state/status 文件。
- 把缺失文件转成明确 UI 状态。

硬性停止：
- 不重做整套 UI。
- 不调用任意 shell 命令。
- 不把缺失 .workflow/state.json 当成错误状态。

期望产物：
- workflow state model 文件
- parser fixture 或样例
- renderer 使用 normalized state 输出

验证：
- cd apps/desktop
- bun run typecheck
- bun run build

验证完成后停止，并说明需要 Codex review 哪些点。
```

### 停止点

满足以下条件必须停止：

- `.workflow/state.json`、`status.json`、`chains/singles/status.json` 都能处理。
- 缺失状态显示为“未初始化”或“暂无数据”。
- `typecheck` 和 `build` 通过。

### 回到 Codex review

让 Codex 检查：

- Parser 正确性。
- 错误处理。
- 测试缺口。
- 是否需要先补测试再进入下一轮。

## Round 4：产品面板 MVP

只有 Codex approve 并提交 Round 3 后才能开始。

### 给 Claude Code 的 Prompt

```text
读取 plans/maestro-productization-workflow.md 和 Round 3 的 Codex review notes。

只执行 Round 4。

目标：
- 把最小壳升级成 MVP 产品工作台。
- 使用 live CLI 数据和必要 mock 数据构建产品面板。

面板：
- Command Center
- Ralph Panel
- Knowledge Panel
- Workflow State Panel
- Visualization Panel

硬性停止：
- 不引入 Superset runtime。
- 不做 landing page。
- 不添加未经 review 的大型依赖。
- 面板可渲染并 build 通过后停止。

验证：
- cd apps/desktop
- bun run typecheck
- bun run build

验证完成后停止，并说明需要 Codex review 哪些点。
```

### 停止点

满足以下条件必须停止：

- App 有上述 5 个面板。
- 面板可以从当前 CLI 输出或 mock 数据渲染。
- `typecheck` 和 `build` 通过。

### 回到 Codex review

让 Codex 检查：

- 产品结构。
- UI 复杂度。
- 数据边界。
- 下一步 merge 策略。

## Round 5：Superset 风格可视化

只有 Codex approve 并提交 Round 4 后才能开始。

### 给 Claude Code 的 Prompt

```text
读取 plans/generated/superset-concept-mapping.md 和 Round 4 的 Codex review notes。

只执行 Round 5。

目标：
- 实现 Superset-inspired visualization，但不嵌入 Superset runtime。

允许概念：
- dashboard-like workspace
- chart-like workflow widgets
- dataset-like command output sources
- explore-like command output explorer
- saved command presets

硬性停止：
- 不安装或嵌入 Apache Superset。
- 不新增后端服务。
- 不实现 auth 或 permissions。
- MVP visualization 可用并 build 通过后停止。

验证：
- cd apps/desktop
- bun run typecheck
- bun run build

验证完成后停止，并说明需要 Codex review 哪些点。
```

### 停止点

满足以下条件必须停止：

- 可视化由 Maestro-flow 命令和状态数据驱动。
- Superset 只作为概念参考。
- `typecheck` 和 `build` 通过。

### 回到 Codex review

让 Codex 检查：

- 产品是否可以 merge 回主 worktree。
- 旧 Superset 迁移代码是否可以删除。
- 是否需要开 PR 或更新 PR。

## 全局停止条件

遇到下面任何情况，立刻停止并回到 Codex：

- Claude Code 想引入 Superset runtime。
- 生成方案直接修改 Electron main process 命令执行逻辑，但没有 review。
- command registry 出现 write / destructive 命令。
- `bun run typecheck` 连续修 2 次仍失败。
- `bun run build` 连续修 2 次仍失败。
- diff 触碰当前轮次之外的无关文件。
- 新依赖的必要性说不清楚。

## 提交策略

Claude Code 只有在满足这些条件后才可以提交：

- 当前轮次停止点已达到。
- `git status --short` 只包含预期文件。
- 改代码时 `bun run typecheck` 通过。
- 改 app 代码时 `bun run build` 通过。

提交信息格式：

```text
feat: 实现命令注册表
docs: 增加产品化分析草案
refactor: 接入 workflow 状态模型
```

不确定时不要提交，回到 Codex。

