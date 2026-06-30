/**
 * CommandPreset — 命令预设类型定义。
 *
 * 预设用于保存常用命令的参数组合，方便快速复用。
 * 数据通过 localStorage 持久化存储。
 */

export interface CommandPreset {
  /** 预设唯一标识 */
  id: string;
  /** 人类可读名称 */
  name: string;
  /** 关联的 CommandDefinition ID */
  commandId: string;
  /** 预填充的 CLI 参数数组 */
  args: string[];
  /** 预设保存时间（ISO 8601） */
  savedAt: string;
  /** 可选描述 */
  description?: string;
}
