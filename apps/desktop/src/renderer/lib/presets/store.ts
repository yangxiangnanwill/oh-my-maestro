/**
 * CommandPreset Store — localStorage 持久化的预设 CRUD。
 *
 * 数据存储在 localStorage key "maestro-command-presets" 中，
 * JSON 解析失败时优雅降级返回空数组。
 */

import type { CommandPreset } from "./types";

const STORAGE_KEY = "maestro-command-presets";

/**
 * 安全地从 localStorage 读取预设数组。
 * JSON 解析失败或 localStorage 不可用时返回空数组。
 */
function readFromStorage(): CommandPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as CommandPreset[];
  } catch {
    return [];
  }
}

/**
 * 安全地向 localStorage 写入预设数组。
 * localStorage 不可用时静默失败。
 */
function writeToStorage(presets: CommandPreset[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // 静默失败 -- 写入不是关键路径
  }
}

/** 加载所有已保存的预设 */
export function loadPresets(): CommandPreset[] {
  return readFromStorage();
}

/** 保存一个新预设（若已存在同 ID 则覆盖） */
export function savePreset(preset: CommandPreset): void {
  const presets = readFromStorage();
  const idx = presets.findIndex((p) => p.id === preset.id);
  if (idx >= 0) {
    presets[idx] = preset;
  } else {
    presets.push(preset);
  }
  writeToStorage(presets);
}

/** 按 ID 删除预设 */
export function deletePreset(id: string): void {
  const presets = readFromStorage();
  writeToStorage(presets.filter((p) => p.id !== id));
}

/** 按关联命令 ID 过滤预设 */
export function getPresetsByCommand(commandId: string): CommandPreset[] {
  return readFromStorage().filter((p) => p.commandId === commandId);
}
