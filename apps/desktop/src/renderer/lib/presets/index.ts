/**
 * Presets 模块 — 命令预设的类型定义和 localStorage 持久化存储。
 */

export type { CommandPreset } from "./types";
export {
  loadPresets,
  savePreset,
  deletePreset,
  getPresetsByCommand,
} from "./store";
