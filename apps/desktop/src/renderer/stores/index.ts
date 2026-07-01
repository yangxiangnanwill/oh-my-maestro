// Stub: renderer/stores
// Provides theme and markdown style hooks used by MarkdownRenderer and related components.
//
// Phase 3: 使用 useSyncExternalStore + 模块级可变状态（而非 zustand），
// 因为主题和 markdown 样式是全局单例，不需要 zustand 的 selector/middleware 能力。
// Phase 4 评估是否统一迁移到 zustand。

import { useSyncExternalStore } from "react";

// --- Theme store ---

type ThemeType = "light" | "dark";

interface ThemeState {
	type: ThemeType;
	activeTheme: { type: ThemeType };
}

const currentTheme: ThemeState = {
	type: "dark",
	activeTheme: { type: "dark" },
};
const themeListeners = new Set<() => void>();

function subscribeTheme(callback: () => void): () => void {
	themeListeners.add(callback);
	return () => themeListeners.delete(callback);
}

function getThemeSnapshot(): ThemeState {
	return currentTheme;
}

export function useTheme(): ThemeState {
	return useSyncExternalStore(subscribeTheme, getThemeSnapshot);
}

// --- Markdown style store ---

type MarkdownStyle = "default" | "tufte";

const currentMarkdownStyle: MarkdownStyle = "default";
const markdownStyleListeners = new Set<() => void>();

function subscribeMarkdownStyle(callback: () => void): () => void {
	markdownStyleListeners.add(callback);
	return () => markdownStyleListeners.delete(callback);
}

function getMarkdownStyleSnapshot(): MarkdownStyle {
	return currentMarkdownStyle;
}

export function useMarkdownStyle(): MarkdownStyle {
	return useSyncExternalStore(subscribeMarkdownStyle, getMarkdownStyleSnapshot);
}
