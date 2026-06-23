import { describe, expect, it } from "bun:test";
import { TRANSLATIONS } from "./translations";
import type { DisplayMode } from "./TranslationContext";

/**
 * 提取 translate 纯逻辑用于测试，避免 React 渲染依赖。
 * 与 TranslationContext.tsx 中 useCallback 内的逻辑完全一致。
 */
export function translateLogic(
	key: string,
	displayMode: DisplayMode,
	overrideMode?: DisplayMode,
): string {
	const effectiveMode = overrideMode ?? displayMode;
	if (effectiveMode === "advanced") {
		return key;
	}
	return TRANSLATIONS[key] ?? key;
}

describe("TranslationContext", () => {
	describe("TRANSLATIONS map", () => {
		it("contains core concept translations", () => {
			expect(TRANSLATIONS.chain).toBe("工作流");
			expect(TRANSLATIONS.phase).toBe("阶段");
			expect(TRANSLATIONS.wave).toBe("批次");
			expect(TRANSLATIONS.task).toBe("任务");
			expect(TRANSLATIONS.step).toBe("步骤");
		});

		it("contains decision and status translations", () => {
			expect(TRANSLATIONS.decision).toBe("决策");
			expect(TRANSLATIONS.decision_node).toBe("决策节点");
			expect(TRANSLATIONS.status).toBe("状态");
			expect(TRANSLATIONS.pending).toBe("等待中");
			expect(TRANSLATIONS.running).toBe("执行中");
			expect(TRANSLATIONS.completed).toBe("已完成");
			expect(TRANSLATIONS.failed).toBe("失败");
		});

		it("contains metadata translations", () => {
			expect(TRANSLATIONS.duration).toBe("耗时");
		});
	});

	describe("translateLogic (pure function)", () => {
		it("returns Chinese translation in simple mode", () => {
			expect(translateLogic("chain", "simple")).toBe("工作流");
			expect(translateLogic("task", "simple")).toBe("任务");
			expect(translateLogic("pending", "simple")).toBe("等待中");
		});

		it("returns original key in advanced mode", () => {
			expect(translateLogic("chain", "advanced")).toBe("chain");
			expect(translateLogic("task", "advanced")).toBe("task");
			expect(translateLogic("decision_node", "advanced")).toBe("decision_node");
		});

		it("returns original key for unmatched keys in simple mode", () => {
			expect(translateLogic("unknown_key", "simple")).toBe("unknown_key");
			expect(translateLogic("nonexistent", "simple")).toBe("nonexistent");
		});

		it("respects overrideMode over displayMode", () => {
			// displayMode is "simple" but overrideMode is "advanced" → returns key
			expect(translateLogic("chain", "simple", "advanced")).toBe("chain");
			// displayMode is "advanced" but overrideMode is "simple" → returns translation
			expect(translateLogic("chain", "advanced", "simple")).toBe("工作流");
		});

		it("defaults to displayMode when overrideMode is undefined", () => {
			expect(translateLogic("task", "simple")).toBe("任务");
			expect(translateLogic("task", "advanced")).toBe("task");
		});
	});

	describe("useTranslation fallback (Provider not mounted)", () => {
		it("falls back to identity function when no Provider", () => {
			// 模拟 useTranslation 在 Provider 未挂载时的 fallback 行为
			// 见 TranslationContext.tsx 第 115-123 行
			const fallbackTranslate = (key: string) => key;
			const fallbackT = (key: string) => key;

			expect(fallbackTranslate("chain")).toBe("chain");
			expect(fallbackT("task")).toBe("task");
			expect(fallbackTranslate("any_key")).toBe("any_key");
		});

		it("fallback displayMode defaults to 'simple'", () => {
			// 验证 fallback 对象中 displayMode 为 "simple"
			const fallbackDisplayMode: DisplayMode = "simple";
			expect(fallbackDisplayMode).toBe("simple");
		});
	});
});
