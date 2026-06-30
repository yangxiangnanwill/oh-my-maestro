/**
 * CommandOutputDataset — CLI 命令的结构化输出数据源定义。
 *
 * 定义命令输出的 Zod schema 和预览用的样本数据，
 * 用于类型安全的数据展示和 UI 预览（CLI 不可用时降级）。
 */

import type { ZodSchema } from "zod";

export interface CommandOutputDataset<T = unknown> {
  /** 数据集唯一标识，如 "knowledge-search" */
  id: string;
  /** 人类可读名称 */
  label: string;
  /** 关联的 CommandDefinition commandId */
  commandId: string;
  /** 简短描述 */
  description: string;
  /** 输出结构的 Zod schema */
  schema: ZodSchema<T>;
  /** 当 CLI 不可用时用于 UI 预览的样本数据 */
  sampleData: T;
}
