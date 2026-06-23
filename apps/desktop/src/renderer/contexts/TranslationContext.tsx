import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { TRANSLATIONS } from "./translations";

/**
 * 显示模式：simple 显示中文翻译，advanced 显示原始英文 key。
 */
export type DisplayMode = "simple" | "advanced";

/**
 * TranslationContext 暴露的值类型。
 */
export interface TranslationContextValue {
  /** 当前显示模式 */
  displayMode: DisplayMode;
  /** 切换显示模式 */
  setDisplayMode: (mode: DisplayMode) => void;
  /**
   * 翻译 Maestro 术语。
   * - simple 模式：查 TRANSLATIONS 表返回中文，无匹配时返回原始 key
   * - advanced 模式：始终返回原始 key
   * @param key 术语键名（snake_case）
   * @param mode 可选的覆写模式，不传则使用当前 displayMode
   */
  translate: (key: string, mode?: DisplayMode) => string;
  /** translate() 的别名 */
  t: (key: string, mode?: DisplayMode) => string;
}

const STORAGE_KEY = "maestro-display-mode";

/**
 * 安全地从 localStorage 读取值。
 * SSR/预渲染环境或浏览器禁用 localStorage 时返回 null。
 */
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * 安全地向 localStorage 写入值。
 */
function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // 静默失败 — 写入不是关键路径
  }
}

const TranslationContext = createContext<TranslationContextValue | null>(null);

/**
 * TranslationProvider — 包裹组件树以提供术语翻译能力。
 *
 * displayMode 默认从 localStorage('maestro-display-mode') 读取，
 * 若无则初始化为 'simple'。模式变更时自动持久化。
 */
export function TranslationProvider({ children }: { children: ReactNode }) {
  const [displayMode, setDisplayModeState] = useState<DisplayMode>(() => {
    const stored = safeGetItem(STORAGE_KEY);
    if (stored === "simple" || stored === "advanced") {
      return stored;
    }
    return "simple";
  });

  useEffect(() => {
    safeSetItem(STORAGE_KEY, displayMode);
  }, [displayMode]);

  const setDisplayMode = useCallback((mode: DisplayMode) => {
    setDisplayModeState(mode);
  }, []);

  const translate = useCallback(
    (key: string, mode?: DisplayMode): string => {
      const effectiveMode = mode ?? displayMode;
      if (effectiveMode === "advanced") {
        return key;
      }
      return TRANSLATIONS[key] ?? key;
    },
    [displayMode],
  );

  const t = translate;

  return (
    <TranslationContext.Provider value={{ displayMode, setDisplayMode, translate, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

/**
 * useTranslation — 获取翻译函数和显示模式。
 *
 * 若在 TranslationProvider 外部调用，会 fallback 返回原始 key，
 * 避免组件树未包裹时崩溃（RSK-T003-1 缓解）。
 */
export function useTranslation(): TranslationContextValue {
  const ctx = useContext(TranslationContext);

  if (!ctx) {
    // Provider 未挂载时的安全 fallback
    return {
      displayMode: "simple",
      setDisplayMode: () => {},
      translate: (key: string) => key,
      t: (key: string) => key,
    };
  }

  return ctx;
}
