/**
 * Dataset 模块 — 命令输出数据的类型定义和样本数据集。
 *
 * 样本数据集用于 UI 预览场景（CLI 不可用时的降级展示）。
 * 每个数据集包含 Zod schema 用于运行时校验和类型推导。
 */

import { z } from "zod";
import type { CommandOutputDataset } from "./types";

export type { CommandOutputDataset } from "./types";

// ---------------------------------------------------------------------------
// Schema 定义
// ---------------------------------------------------------------------------

/** 知识搜索结果条目 */
const searchResultItemSchema = z.object({
  title: z.string(),
  type: z.enum(["spec", "knowhow", "wiki", "code", "session"]),
  score: z.number().min(0).max(1),
  snippet: z.string(),
  path: z.string(),
});

/** 知识搜索结果数据集 */
export const searchResultDataset: CommandOutputDataset<
  z.infer<typeof searchResultItemSchema>[]
> = {
  id: "knowledge-search",
  label: "知识搜索结果",
  commandId: "knowledge-search",
  description: "跨 spec、knowhow、wiki、代码的语义搜索结果",
  schema: z.array(searchResultItemSchema),
  sampleData: [
    {
      title: "TypeScript 类型安全指南",
      type: "spec",
      score: 0.92,
      snippet: "使用 strict 模式确保类型安全，避免 any...",
      path: "specs/typescript-guide.md",
    },
    {
      title: "React 组件设计模式",
      type: "knowhow",
      score: 0.87,
      snippet: "容器组件与展示组件分离，使用 Hooks 管理状态...",
      path: "knowhow/react-patterns.md",
    },
  ],
};

// ---------------------------------------------------------------------------

/** Ralph 会话信息条目 */
const sessionInfoItemSchema = z.object({
  sessionId: z.string(),
  status: z.enum(["active", "idle", "completed", "error"]),
  startedAt: z.string(),
  taskCount: z.number().int().min(0),
  model: z.string(),
});

/** Ralph 会话信息数据集 */
export const sessionInfoDataset: CommandOutputDataset<
  z.infer<typeof sessionInfoItemSchema>[]
> = {
  id: "ralph-session",
  label: "Ralph 会话信息",
  commandId: "ralph-session",
  description: "查看当前 Ralph 会话信息和状态",
  schema: z.array(sessionInfoItemSchema),
  sampleData: [
    {
      sessionId: "ralph-20260629-001",
      status: "active",
      startedAt: "2026-06-29T10:30:00Z",
      taskCount: 5,
      model: "claude-sonnet-4-6",
    },
  ],
};

// ---------------------------------------------------------------------------

/** 技能列表条目 */
const skillsListItemSchema = z.object({
  name: z.string(),
  category: z.enum(["ralph", "knowledge", "debug", "project"]),
  enabled: z.boolean(),
  description: z.string(),
});

/** 技能列表数据集 */
export const skillsListDataset: CommandOutputDataset<
  z.infer<typeof skillsListItemSchema>[]
> = {
  id: "ralph-skills",
  label: "技能列表",
  commandId: "ralph-skills",
  description: "列出 Ralph 可用的技能和角色配置",
  schema: z.array(skillsListItemSchema),
  sampleData: [
    {
      name: "code-review",
      category: "ralph",
      enabled: true,
      description: "自动化代码审查和最佳实践检查",
    },
    {
      name: "knowledge-search",
      category: "knowledge",
      enabled: true,
      description: "跨知识库的语义搜索",
    },
    {
      name: "debug-trace",
      category: "debug",
      enabled: false,
      description: "代码执行追踪和错误定位",
    },
  ],
};
