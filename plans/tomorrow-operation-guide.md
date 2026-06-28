# 明日操作指引

这份文档是明天实际操作用的，不需要理解全部架构，照顺序执行即可。

## 0. 当前状态

当前有效 worktree：

```powershell
D:\WorkSpace\VsCode\oh-my-maestro-rebuild
```

当前分支：

```powershell
rebuild/maestro-visual-shell
```

当前目标：

- 不继续迁 Superset runtime。
- 先把 Maestro-flow 包装成可视化桌面产品。
- Claude Code / CodePlan 做分析和搬运。
- Codex 做 review、收口和关键实现。

## 1. 打开项目

在 PowerShell 中执行：

```powershell
cd D:\WorkSpace\VsCode\oh-my-maestro-rebuild
git status
git pull
```

如果 `git pull` 因网络失败，先不用处理，只要 `git status` 没有奇怪的未提交变更即可。

然后用 Claude Code 打开：

```powershell
code .
```

或者直接在 Claude Code 中选择这个目录。

## 2. 让 Claude Code 读取流程

在 Claude Code 里输入：

```text
/maestro-next plans/maestro-productization-workflow.md
```

然后继续输入 Round 1 prompt。

## 3. Round 1 Prompt

复制下面整段给 Claude Code：

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
- 只允许在 plans/generated/ 下写 Markdown 分析产物。
- 生成 Round 1 产物后立刻停止。

期望产物：
- plans/generated/command-registry-draft.md
- plans/generated/superset-concept-mapping.md
- plans/generated/round-1-review-notes.md

允许运行：
- maestro --help
- maestro ralph --help
- maestro search --help
- maestro load --help

可以使用 CodePlan、DeepSeek 或 GLM 来整理命令元数据，但它们只能做提取和结构化，不能做架构决策。

产物写完后停止，并说明需要 Codex review 哪些点。
```

## 4. Round 1 完成后的检查

Claude Code 停止后，先看是否生成了这些文件：

```powershell
dir plans\generated
```

应该看到：

```text
command-registry-draft.md
superset-concept-mapping.md
round-1-review-notes.md
```

然后检查是否误改代码：

```powershell
git status --short
```

理想结果是只看到：

```text
?? plans/generated/
```

如果看到 `apps/desktop/src/main/index.ts`、`apps/desktop/src/renderer/App.tsx` 或其他代码文件被改了，先不要提交，回到 Codex。

## 5. 回到 Codex 的话术

Round 1 完成后，把下面这段发给 Codex：

```text
Claude Code 已按 plans/maestro-productization-todo.md 完成 Round 1。

请 review：
- plans/generated/command-registry-draft.md
- plans/generated/superset-concept-mapping.md
- plans/generated/round-1-review-notes.md

重点检查：
- command registry 是否安全；
- 哪些命令适合 MVP read-only；
- 是否避免了 Superset runtime 依赖；
- Round 2 应该只做 registry，还是同时做 parser model。
```

## 6. 不要做的事

明天第一轮不要做这些：

- 不要让 Claude Code 直接实现 UI。
- 不要让 Claude Code 修改 Electron main process。
- 不要引入 Apache Superset。
- 不要安装大型依赖。
- 不要让它一次性执行 Round 2、Round 3。
- 不要在未 review 前 merge。

## 7. 如果 Claude Code 想继续

如果 Claude Code 生成 Round 1 产物后还想继续，你直接回复：

```text
停止。Round 1 已到 checkpoint。不要继续执行 Round 2。请只汇总产物和需要 Codex review 的问题。
```

## 8. 如果需要使用 CodePlan / DeepSeek / GLM

可以把下面 prompt 给低成本模型：

```text
你正在为 Oh My Maestro 整理 Maestro CLI 命令元数据。

不要做架构设计。
不要修改代码。
不要修改 IPC。
不要实现 UI。

输入是 Maestro CLI help 输出。

请只返回 JSON：
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

不确定的字段填 null。
写入类命令标记为 "write"。
危险命令标记为 "destructive"。
```

## 9. 明天的完成标准

明天只要完成这些就够了：

- Round 1 三份文档生成。
- 没有误改代码。
- Codex 完成 review。
- 明确 Round 2 是否开始。

不要追求一天内整合完 Superset 和 Maestro-flow。

