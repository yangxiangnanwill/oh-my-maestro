# Command Registry Draft

> **Round 1 产物** — 基于 `maestro --help`、`maestro ralph --help`、`maestro search --help`、`maestro load --help` 及各子命令 `--help` 输出整理。
> **待 Codex Review**: 命令形状安全性、MVP read-only 边界、riskLevel 分级。

## 接口定义（建议）

```ts
export interface CommandDefinition {
  id: string;
  label: string;
  category: "workflow" | "ralph" | "knowledge" | "project" | "debug" | "config" | "system";
  args: string[];
  description: string;
  outputKind: "text" | "json" | "state" | "table" | "stream";
  riskLevel: "read" | "write" | "destructive";
  notes?: string;
}
```

### 变更说明（vs 当前 MAESTRO_TOOL_CATALOG）

- 新增 `config` 和 `system` category（原 catalog 把这些归入 utility）
- 新增 `outputKind: "stream"` 用于长期运行命令（serve、ralph next）
- 新增 `riskLevel` 字段（当前 catalog 没有）
- `id` 改为 kebab-case（当前 catalog 用 snake_case 如 `maestro_search`）

---

## 命令清单

### Category: workflow（工作流编排）

| id | label | args | description | outputKind | riskLevel |
|---|---|---|---|---|---|
| `maestro-init` | 初始化项目 | `[-y] [--from <source>]` | 初始化 .workflow/ 目录结构和项目状态 | json | write |
| `maestro-brainstorm` | 头脑风暴 | `[topic] [--yes] [-c]` | 多角色创意探索，产出引导规格说明 | json | write |
| `maestro-blueprint` | 正式规格 | `<idea> [-y] [-c]` | 6 阶段文档链产出 Product Brief → PRD → Architecture → Epics | json | write |
| `maestro-analyze` | 多维分析 | `[phase\|topic] [-y] [-c] [-q]` | 6 维评分 + 讨论时间线 + 决策提取 | json | write |
| `maestro-plan` | 执行规划 | `[phase] [--collab]` | 基于分析产出分解任务，生成可执行计划 | json | write |
| `maestro-execute` | 执行实现 | `[phase] [--auto-commit]` | 按计划执行实现任务 | text | write |
| `maestro-quick` | 快速执行 | `[description] [--full]` | 跳过规划直接执行单次任务 | text | write |
| `maestro-grill` | 压力测试 | `<topic> [-y] [-c]` | 对方案/计划做边界施压测试 | json | write |
| `maestro-roadmap` | 生成路线图 | `<requirement> [-y] [-c]` | 需求分解为里程碑+阶段路线图 | json | write |
| `maestro-collab` | 多 CLI 协作 | `<requirement> [--tools ...]` | 多 CLI 交叉验证和协作分析 | json | write |
| `maestro-fork` | 分支并行 | `-m <milestone> [--branch]` | 为里程碑创建独立 worktree 分支 | json | write |
| `maestro-merge` | 合并分支 | `-m <milestone> [--force]` | 将 worktree 分支合并回主线 | json | write |
| `maestro-swarm-workflow` | 蜂群工作流 | `<intent> [--script]` | 并行 workflow 加速，路由到固定脚本 | json | write |
| `maestro-composer` | 工作流编排 | `<description> [--dry-run]` | 从自然语言描述生成可复用工作流模板 | json | write |
| `maestro-player` | 播放模板 | `<template> [--context]` | 执行已保存的工作流模板 | text | write |
| `maestro-universal-workflow` | 通用工作流 | `<intent> [--name]` | 动态对抗式工作流生成器 | json | write |

### Category: ralph（Ralph 会话驱动）

| id | label | args | description | outputKind | riskLevel |
|---|---|---|---|---|---|
| `ralph-skills` | 技能列表 | `[--platform <name>]` | 列出当前可用的命令和技能 | table | read |
| `ralph-check` | 健康检查 | `[--json]` | 检查 ralph status.json 健康状态 | json | read |
| `ralph-session` | 会话状态 | `[--json]` | 显示当前 ralph 会话摘要 | json | read |
| `ralph-next` | 下一步 | `[--auto]` | 加载下一个待执行步骤并写入 status.json | state | write |
| `ralph-complete` | 完成步骤 | `<index> --status <STATUS>` | 标记指定步骤完成并附状态裁定 | text | write |
| `ralph-retry` | 重试步骤 | `<index>` | 标记指定步骤为 NEEDS_RETRY | text | write |

### Category: knowledge（知识管理）

| id | label | args | description | outputKind | riskLevel |
|---|---|---|---|---|---|
| `knowledge-search` | 知识搜索 | `<query> [--type] [--code] [--kg] [--json]` | 统一搜索 wiki + 代码知识图谱 | json | read |
| `knowledge-load` | 知识加载 | `[--type] [--category] [--keyword] [--list]` | 加载 specs / wiki / sessions 等知识条目 | json | read |
| `spec-load` | 规格加载 | `[--category] [--keyword] [--list]` | 加载项目规格约束 | json | read |
| `spec-add` | 规格添加 | `<category> <title> [content] --keywords` | 添加新的规格条目 | text | write |
| `knowhow-search` | 经验搜索 | `<query> [--json]` | 搜索 knowhow 条目 | json | read |
| `knowhow-capture` | 经验捕获 | `[<type>] [<description>]` | 捕获可复用知识为模板/提示 | text | write |
| `wiki-search` | Wiki 搜索 | `<query> [--live]` | BM25 搜索 wiki 条目 | json | read |
| `wiki-health` | Wiki 健康 | `[--live]` | 检查知识图谱健康度 | json | read |
| `wiki-graph` | Wiki 图谱 | `[--live]` | 输出完整图谱（前向/后向/断链） | json | read |
| `domain-add` | 术语添加 | `<canonical> "<definition>"` | 注册项目领域术语 | text | write |
| `domain-list` | 术语列表 | `[--json]` | 列出所有领域术语 | json | read |
| `kg-sync` | 知识图谱同步 | `[--source]` | 从代码库同步 MaestroGraph | json | write |
| `kg-query` | 图谱查询 | `<text>` | 跨层知识图谱搜索 | json | read |
| `kg-context` | 节点上下文 | `<node>` | 显示节点完整上下文 | json | read |
| `kg-callers` | 调用者 | `<node>` | 显示函数/方法的调用者 | json | read |
| `kg-callees` | 被调用者 | `<node>` | 显示函数/方法的被调用者 | json | read |

### Category: project（项目管理）

| id | label | args | description | outputKind | riskLevel |
|---|---|---|---|---|---|
| `milestone-audit` | 里程碑审计 | `[<milestone>]` | 审计里程碑跨阶段集成缺口 | json | read |
| `milestone-complete` | 里程碑完成 | `[<milestone>]` | 归档已完成里程碑，准备下一个 | json | write |
| `milestone-release` | 里程碑发布 | `[<version>] [--bump]` | 版本号更新 + changelog + tag | json | write |
| `manage-status` | 项目状态 | — | 显示项目仪表盘和进度 | table | read |
| `manage-issue` | 缺陷管理 | `<subcommand> [args]` | 创建/列出/更新/关闭 issue | json | write |
| `manage-issue-discover` | 缺陷发现 | `[perspective]` | 多视角缺陷发现 | json | read |
| `manage-harvest` | 知识提取 | `[<session>] [--to]` | 从会话产物提取知识到 wiki/spec | json | write |
| `manage-codebase-rebuild` | 文档重建 | `[--focus] [--force]` | 从头重建代码库文档 | json | write |
| `manage-knowledge-audit` | 知识审计 | `--scope <scope>` | 审计和修剪知识存储 | json | write |
| `manage-kg-extractors` | 提取器管理 | `[--scan-only]` | 分析代码模式生成自定义提取器 | json | write |

### Category: debug（质量保障）

| id | label | args | description | outputKind | riskLevel |
|---|---|---|---|---|---|
| `quality-debug` | 调试排查 | `[issue] [--from]` | 系统化根因调查 | json | write |
| `quality-review` | 代码审查 | `[phase]` | 多维度代码审查 | json | write |
| `quality-auto-test` | 自动测试 | `<phase> [-y] [-c]` | 自动扩展测试覆盖 | json | write |
| `quality-refactor` | 代码重构 | `[<scope>]` | 技术债识别和修复 | json | write |
| `quality-retrospective` | 回顾总结 | `[phase] [--lens]` | 阶段完成后提取经验教训 | json | write |
| `quality-sync` | 文档同步 | — | 基于 git diff 同步代码库文档 | json | write |
| `security-audit` | 安全审计 | — | OWASP Top 10 + STRIDE 审计 | json | read |
| `learn-follow` | 跟读源码 | `<path\|topic> [--depth]` | 引导式代码阅读 | text | read |
| `learn-investigate` | 调查分析 | `<question> [--scope]` | 假设驱动的代码调查 | text | read |
| `learn-decompose` | 模式提取 | `<path\|module> [--patterns]` | 从代码提取设计模式到规格 | json | write |
| `learn-second-opinion` | 第二意见 | `<target> [--mode]` | 获取替代视角 | text | read |

### Category: config（配置管理）

| id | label | args | description | outputKind | riskLevel |
|---|---|---|---|---|---|
| `config-skills` | 技能配置 | — | Skill 参数默认值 TUI | text | write |
| `config-delegate` | 委托配置 | — | 委托工具配置 TUI | text | write |
| `config-hooks` | 钩子配置 | — | Hook 安装状态 TUI | text | write |
| `config-overlay` | 覆盖层配置 | — | Overlay 管理 TUI | text | write |
| `config-specs` | 规格配置 | — | Spec 系统状态 TUI | text | write |
| `overlay-list` | 覆盖层列表 | — | 显示已安装的覆盖层 | table | read |
| `overlay-apply` | 覆盖层应用 | — | 重新应用所有覆盖层 | text | write |
| `overlay-add` | 覆盖层添加 | `<file>` | 安装覆盖层 JSON 并应用 | text | write |
| `overlay-remove` | 覆盖层移除 | `<name>` | 剥离并删除覆盖层 | text | write |
| `hooks-status` | 钩子状态 | — | 显示 hook 安装状态 | table | read |
| `hooks-install` | 钩子安装 | `[--platform]` | 安装 maestro hooks | text | write |
| `hooks-list` | 钩子列表 | — | 列出所有 hooks 及状态 | table | read |
| `delegate-exec` | 委托执行 | `<prompt> --to <tool> --mode` | 将 prompt 委托给 CLI agent 工具 | text | write |
| `delegate-show` | 委托列表 | `[--limit]` | 列出最近的委托执行 | table | read |

### Category: system（系统运维）

| id | label | args | description | outputKind | riskLevel |
|---|---|---|---|---|---|
| `serve` | 启动服务 | `[options]` | 启动 maestro workflow 服务器 | stream | write |
| `run` | 执行工作流 | `<workflow> [options]` | 按名称执行工作流 | text | write |
| `update` | 检查更新 | `[--dry-run] [--force]` | 检查并安装最新版本 | text | write |
| `install` | 安装资产 | `[--interactive]` | 安装 maestro 资产 | text | write |
| `uninstall` | 卸载资产 | `[--interactive]` | 移除已安装的 maestro 资产 | text | write |
| `explore` | 代码探索 | `<prompts...> [--endpoint]` | 轻量级并行代码探索 | json | read |
| `workspace-link` | 关联工作区 | `<path>` | 关联其他 Maestro 工作区 | json | write |
| `workspace-list` | 工作区列表 | — | 列出已关联的工作区 | json | read |
| `impeccable` | 设计工具 | `<command\|intent> [target]` | UI 设计和打磨工具 | json | write |

---

## MVP Read-Only 安全边界

**Round 1 建议：MVP 阶段只暴露 `riskLevel: "read"` 命令。**

### ✅ MVP 可安全暴露的 read 命令（20 个）

| Category | 命令 |
|----------|------|
| ralph | `ralph-skills`, `ralph-check`, `ralph-session` |
| knowledge | `knowledge-search`, `knowledge-load`, `spec-load`, `knowhow-search`, `wiki-search`, `wiki-health`, `wiki-graph`, `domain-list`, `kg-query`, `kg-context`, `kg-callers`, `kg-callees` |
| project | `milestone-audit`, `manage-status`, `manage-issue-discover` |
| debug | `quality-retrospective`, `security-audit`, `learn-follow`, `learn-investigate`, `learn-second-opinion` |
| system | `explore`, `workspace-list` |
| config | `overlay-list`, `hooks-status`, `delegate-show` |

### 🚫 MVP 禁止暴露的 write/destructive 命令

- 所有 `riskLevel: "write"` 命令（`maestro-init`, `maestro-execute`, `maestro-plan`, `delegate-exec`, `ralph-complete`, `ralph-next` 等）
- `serve`、`run`（可能启动长期进程或执行任意工作流）
- `install`、`uninstall`（修改文件系统）

### ⚠️ 需要特别 Review 的边界命令

| 命令 | 问题 | 建议 |
|------|------|------|
| `ralph-next` | 标记为 write（修改 status.json），但仅是推进会话状态 | 确认后可降级为 read（只读输出不写文件） |
| `knowledge-load` | 表面 read，但 `--type session` 可能触发文件读取 | 保持 read，限制读取范围 |
| `manage-issue-discover` | 表面 read，但可能启动 CLI 探索（长时间运行） | 添加超时保护 |

---

## 与当前 MAESTRO_TOOL_CATALOG 的对照

| 差异点 | 当前 catalog | 建议 |
|--------|-------------|------|
| 命令数量 | 28 个（静态硬编码） | 52+ 个（从 CLI help 提取） |
| Category | 4 类（knowledge/analysis/command/utility） | 7 类（workflow/ralph/knowledge/project/debug/config/system） |
| riskLevel | 无 | 新增 read/write/destructive |
| outputKind | 无 | 新增 text/json/state/table/stream |
| id 格式 | snake_case（`maestro_search`） | kebab-case（`knowledge-search`） |
| 执行通道 | 仅 MCP catalog → tRPC `commands.list` | 需要按 riskLevel 分流：read → tRPC 直查，write → 需确认 |

## 需 Codex Review 的点

1. **CommandDefinition 接口形状** — `outputKind: "stream"` 是否需要？MVP 是否应该简化为 text/json 二选一？
2. **id 命名方案** — kebab-case vs snake_case，是否保持与当前 catalog 向后兼容？
3. **riskLevel 分级** — `ralph-next` 是 read 还是 write？`knowledge-load` 加载 session 算不算有副作用？
4. **命令数量** — 52+ 个命令是否过多？MVP 是否应该只取当前 catalog 已验证的 28 个 + ralph 6 个？
5. **category 分裂** — 当前 4 类变 7 类，UI 分组需要同步调整
6. **CLI 调用路径** — read 命令走 tRPC execFile，write 命令走 preload IPC + 确认弹窗，这个分流方案是否合理？
