import { describe, expect, test } from "bun:test";
// biome-ignore lint/style/noRestrictedImports: test file needs fs/path for source verification
import { readFileSync } from "node:fs";
// biome-ignore lint/style/noRestrictedImports: test file needs fs/path for source verification
import { join } from "node:path";
import { extractFunctionSource } from "../../test-utils/source-analysis";

/**
 * CommandChainPanel 源码静态分析测试。
 *
 * 由于 CommandChainPanel 依赖 @trpc/react-query 的 electronTrpc context，
 * 传统 React 渲染测试需要大量 mock，源码静态分析是最实际的替代方案。
 * 参考 PromptGroup.test.ts 的测试模式。
 */
describe("CommandChainPanel", () => {
	const source = readFileSync(
		join(import.meta.dir, "CommandChainPanel.tsx"),
		"utf8",
	);

	test("EmptyState component is defined and shows placeholder text", () => {
		const body = extractFunctionSource(source, "EmptyState");
		expect(body).toContain("暂无可用的命令链状态");
		expect(body).toContain("status.json");
	});

	test("LoadingState component is defined and shows loading indicator", () => {
		const body = extractFunctionSource(source, "LoadingState");
		expect(body).toContain("加载中...");
		expect(body).toContain("animate-spin");
	});

	test("ErrorState component is defined and shows error message", () => {
		const body = extractFunctionSource(source, "ErrorState");
		expect(body).toContain("获取命令链状态失败");
		expect(body).toContain("AlertTriangle");
	});

	test("CommandChainPanel component is exported and contains key sections", () => {
		const body = extractFunctionSource(source, "CommandChainPanel");
		expect(body).toContain("function CommandChainPanel");
		expect(body).toContain("步骤进度");
		expect(body).toContain("决策节点");
		expect(body).toContain("所有步骤已确认完成");
	});

	test("CommandChainPanel renders EmptyState when no status data", () => {
		const body = extractFunctionSource(source, "CommandChainPanel");
		// 无 typedStatus 时应渲染 EmptyState
		expect(body).toContain("<EmptyState />");
	});

	test("CommandChainPanel renders LoadingState when loading", () => {
		const body = extractFunctionSource(source, "CommandChainPanel");
		expect(body).toContain("<LoadingState />");
	});

	test("CommandChainPanel renders ErrorState on error", () => {
		const body = extractFunctionSource(source, "CommandChainPanel");
		expect(body).toContain("<ErrorState");
		expect(body).toContain("error instanceof Error");
	});

	test("CommandChainPanel uses ListChecks icon for empty state", () => {
		expect(source).toContain("ListChecks");
	});
});
