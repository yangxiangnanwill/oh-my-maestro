// Stub: renderer/stores
// Provides theme and markdown style hooks used by MarkdownRenderer and related components.

import { useCallback, useSyncExternalStore } from "react";

// --- Theme store ---

type ThemeType = "light" | "dark";

interface ThemeState {
  type: ThemeType;
  activeTheme: { type: ThemeType };
}

let currentTheme: ThemeState = { type: "dark", activeTheme: { type: "dark" } };
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

let currentMarkdownStyle: MarkdownStyle = "default";
const markdownStyleListeners = new Set<() => void>();

function subscribeMarkdownStyle(callback: () => void): () => void {
  markdownStyleListeners.add(callback);
  return () => markdownStyleListeners.delete(callback);
}

function getMarkdownStyleSnapshot(): MarkdownStyle {
  return currentMarkdownStyle;
}

export function useMarkdownStyle(): MarkdownStyle {
  return useSyncExternalStore(
    subscribeMarkdownStyle,
    getMarkdownStyleSnapshot,
  );
}
