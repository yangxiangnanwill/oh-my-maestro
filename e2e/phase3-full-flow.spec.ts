/**
 * Phase 3 Full Integration — 端到端集成测试。
 *
 * 验证所有 5 个 Wave 产出的组件协同工作能力，覆盖完整用户旅程：
 *   自然语言需求 → 命令链执行 → UI 可视化（知识面板 + 分析面板）
 *   → 命令面板 → Ralph 决策 → 执行完成。
 *
 * 测试策略：
 *   - 场景 1-4：源码静态分析（验证组件结构、数据流、状态处理）
 *     遵循 CommandChainPanel.test.tsx 的 `extractFunctionSource` 模式
 *   - 场景 5：组件协同验证（跨组件数据流和交互契约检查）
 *
 * 注意：完整 e2e 渲染测试需要完整 Superset monorepo 环境（含 tRPC 上下文、
 * bun test 框架、React 渲染器）。以下测试在源码层面验证所有关键接口和
 * 数据流路径正确性。
 */

import { describe, expect, test } from "bun:test";
// biome-ignore lint/style/noRestrictedImports: test file needs fs/path for source verification
import { readFileSync } from "node:fs";
// biome-ignore lint/style/noRestrictedImports: test file needs fs/path for source verification
import { join } from "node:path";
import { extractFunctionSource } from "../apps/desktop/src/renderer/test-utils/source-analysis";

// =========================================================================
// 辅助函数
// =========================================================================

/** 加载组件源码 */
function loadSource(componentPath: string): string {
  return readFileSync(componentPath, "utf8");
}

/** 验证组件存在的函数/组件 */
function assertContainsSource(
  source: string,
  patterns: string[],
  label: string,
) {
  for (const pattern of patterns) {
    expect(source).toContain(pattern);
  }
}

// 组件路径常量
const PANELS = {
  knowledgePanel: join(
    import.meta.dir,
    "..",
    "apps/desktop/src/renderer/components/KnowledgePanel/KnowledgePanel.tsx",
  ),
  analysisPanel: join(
    import.meta.dir,
    "..",
    "apps/desktop/src/renderer/components/AnalysisPanel/AnalysisPanel.tsx",
  ),
  commandPalette: join(
    import.meta.dir,
    "..",
    "apps/desktop/src/renderer/components/CommandPalette/CommandPalette.tsx",
  ),
  commandChainPanel: join(
    import.meta.dir,
    "..",
    "apps/desktop/src/renderer/components/CommandChainPanel/CommandChainPanel.tsx",
  ),
  maestroRouter: join(
    import.meta.dir,
    "..",
    "apps/desktop/src/lib/trpc/routers/maestro/index.ts",
  ),
  mcpProvider: join(
    import.meta.dir,
    "..",
    "apps/desktop/src/main/lib/agent-setup/maestro-mcp-provider.ts",
  ),
  decisionBridge: join(
    import.meta.dir,
    "..",
    "apps/desktop/src/main/lib/agent-setup/ralph-decision-bridge.ts",
  ),
  websocketEventBus: join(
    import.meta.dir,
    "..",
    "apps/desktop/src/main/lib/websocket-event-bus.ts",
  ),
};

// =========================================================================
// 场景 1: KG 搜索流程 — 知识面板渲染 + 数据流
// =========================================================================

describe("场景 1: KG 搜索流程 — KnowledgePanel 搜索 → 结果展示", () => {
  const knowledgeSource = loadSource(PANELS.knowledgePanel);
  const routerSource = loadSource(PANELS.maestroRouter);
  const mcpSource = loadSource(PANELS.mcpProvider);

  test("1.1 KnowledgePanel 包含搜索输入框 + debounce 逻辑", () => {
    const body = extractFunctionSource(knowledgeSource, "KnowledgePanel");
    expect(body).toContain("const [searchText, setSearchText]");
    expect(body).toContain("setDebouncedQuery(searchText.trim())");
    expect(body).toContain("placeholder");
    expect(body).toContain("onChange={(e) => setSearchText(e.target.value)}");
  });

  test("1.2 KnowledgePanel 通过 tRPC 调用 maestro.knowledge.search", () => {
    const body = extractFunctionSource(knowledgeSource, "KnowledgePanel");
    expect(body).toContain("electronTrpc.maestro.knowledge.search.useQuery");
    expect(body).toContain("debouncedQuery");
    expect(body).toContain("cwd");
    expect(body).toContain("{ enabled }");
  });

  test("1.3 KnowledgePanel 实现完整的四态（现五态）渲染", () => {
    const body = extractFunctionSource(knowledgeSource, "KnowledgePanel");
    // showLoading → <LoadingState />
    expect(body).toContain("showLoading");
    expect(body).toContain("<LoadingState />");
    // showError → <ErrorState />
    expect(body).toContain("showError");
    expect(body).toContain("<ErrorState");
    // showEmpty → <EmptyState />
    expect(body).toContain("showEmpty");
    expect(body).toContain("<EmptyState />");
    // showNoResults → <NoResultsState />
    expect(body).toContain("showNoResults");
    expect(body).toContain("<NoResultsState");
    // showResults → 结果列表
    expect(body).toContain("showResults");
    expect(body).toContain("<KnowledgeCard");
  });

  test("1.4 tRPC router 的 knowledge.search endpoint 接受 {query, cwd} 输入", () => {
    expect(routerSource).toContain("knowledge: router({");
    expect(routerSource).toContain("search: publicProcedure");
    expect(routerSource).toContain("query: z.string().min(1");
    expect(routerSource).toContain("cwd: z.string().min(1)");
  });

  test("1.5 tRPC router 调用 maestro search CLI 并解析输出", () => {
    expect(routerSource).toContain("maestro");
    expect(routerSource).toContain('"search"');
    expect(routerSource).toContain("parseSearchOutput");
  });

  test("1.6 MCP provider 包含 maestro_search 工具（KG 搜索能力）", () => {
    expect(mcpSource).toContain("maestro_search");
    expect(mcpSource).toContain("knowledge");
    expect(mcpSource).toContain("Semantic knowledge-graph search");
  });

  test("1.7 KnowledgeCard 显示 entityName + relevanceScore", () => {
    const knowledgeCardFile = join(
      import.meta.dir,
      "..",
      "apps/desktop/src/renderer/components/KnowledgePanel/KnowledgeCard.tsx",
    );
    const cardSource = readFileSync(knowledgeCardFile, "utf8");
    expect(cardSource).toContain("entity.name");
    expect(cardSource).toContain("entity.relevanceScore");
    expect(cardSource).toContain("entity.type");
  });
});

// =========================================================================
// 场景 2: 分析流程 — AnalysisPanel 6 维评分 + 风险矩阵渲染
// =========================================================================

describe("场景 2: 分析流程 — maestro analyze → AnalysisPanel 数据展示", () => {
  const analysisSource = loadSource(PANELS.analysisPanel);
  const typesSource = readFileSync(
    join(
      import.meta.dir,
      "..",
      "apps/desktop/src/renderer/components/AnalysisPanel/types.ts",
    ),
    "utf8",
  );
  const routerSource = loadSource(PANELS.maestroRouter);

  test("2.1 AnalysisPanel 通过 tRPC 调用 maestro.analyze.result", () => {
    const body = extractFunctionSource(analysisSource, "AnalysisPanel");
    expect(body).toContain("electronTrpc.maestro.analyze.result.useQuery");
    expect(body).toContain("{ cwd, topic }");
  });

  test("2.2 AnalysisPanel 渲染 OverallVerdict 横幅", () => {
    expect(analysisSource).toContain("function OverallVerdictBanner");
    expect(analysisSource).toContain('verdict === "GO"');
    expect(analysisSource).toContain('verdict === "CONDITIONAL_GO"');
    expect(analysisSource).toContain('verdict === "NO-GO"');
    expect(analysisSource).toContain("GO — 建议推进");
    expect(analysisSource).toContain(
      "CONDITIONAL GO — 条件满足后可推进",
    );
    expect(analysisSource).toContain("NO-GO — 不建议推进");
  });

  test("2.3 AnalysisPanel 渲染 6 维评分卡网格", () => {
    const body = extractFunctionSource(analysisSource, "AnalysisPanel");
    expect(body).toContain("维度评分");
    expect(body).toContain("<ScoreCard");
    expect(body).toContain("result.dimensions");
  });

  test("2.4 AnalysisPanel 渲染风险矩阵", () => {
    const body = extractFunctionSource(analysisSource, "AnalysisPanel");
    expect(body).toContain("<RiskMatrix");
    expect(body).toContain("result.risks");
  });

  test("2.5 AnalysisPanel 实现四态渲染", () => {
    const body = extractFunctionSource(analysisSource, "AnalysisPanel");
    // LoadingState
    expect(body).toContain("isLoading");
    expect(body).toContain("<LoadingState />");
    // ErrorState
    expect(body).toContain("<ErrorState");
    // EmptyState
    expect(body).toContain("<EmptyState />");
  });

  test("2.6 mapAnalyzeResult 正确映射后端 → 前端类型", () => {
    expect(typesSource).toContain("function mapAnalyzeResult");
    // score 0-10 → 1-5
    expect(typesSource).toContain("Math.round(d.score / 2)");
    // overallScore 0-10 → 0-100
    expect(typesSource).toContain("Math.round(raw.overallScore * 10)");
    // severity → impact
    expect(typesSource).toContain("mapSeverityToNumber");
    expect(typesSource).toContain("mapLikelihoodToNumber");
  });

  test("2.7 tRPC analyze.result endpoint 接受 {cwd, topic?} 输入", () => {
    expect(routerSource).toContain("analyze: router({");
    expect(routerSource).toContain("result: publicProcedure");
    expect(routerSource).toContain("topic: z.string().optional()");
    expect(routerSource).toContain("cwd: z.string().min(1)");
  });

  test("2.8 tRPC router 执行 maestro analyze --json", () => {
    expect(routerSource).toContain('"analyze"');
    expect(routerSource).toContain("--json");
    expect(routerSource).toContain("parseAnalyzeOutput");
  });

  test("2.9 ScoreCard 组件存在并渲染维度评分", () => {
    const scoreCardFile = join(
      import.meta.dir,
      "..",
      "apps/desktop/src/renderer/components/AnalysisPanel/ScoreCard.tsx",
    );
    const scSource = readFileSync(scoreCardFile, "utf8");
    // ScoreCard 通过解构获取字段: const { name, score, confidence, evidence } = dimension;
    expect(scSource).toContain("name, score, confidence, evidence");
    expect(scSource).toContain("= dimension");
    expect(scSource).toContain("Star");
    expect(scSource).toContain("置信度");
  });

  test("2.10 RiskMatrix 组件存在并渲染 5x5 热力图", () => {
    const riskMatrixFile = join(
      import.meta.dir,
      "..",
      "apps/desktop/src/renderer/components/AnalysisPanel/RiskMatrix.tsx",
    );
    const rmSource = readFileSync(riskMatrixFile, "utf8");
    expect(rmSource).toContain("probability");
    expect(rmSource).toContain("impact");
  });
});

// =========================================================================
// 场景 3: 命令面板流程 — CommandPalette 搜索 + 命令触发
// =========================================================================

describe("场景 3: 命令面板流程 — CommandPalette 搜索 → 命令执行", () => {
  const paletteSource = loadSource(PANELS.commandPalette);
  const typesSource = readFileSync(
    join(
      import.meta.dir,
      "..",
      "apps/desktop/src/renderer/components/CommandPalette/types.ts",
    ),
    "utf8",
  );

  test("3.1 CommandPalette 通过 tRPC 获取命令列表", () => {
    const body = extractFunctionSource(paletteSource, "CommandPalette");
    expect(body).toContain("electronTrpc.maestro.commands.list.useQuery");
  });

  test("3.2 CommandPalette 支持实时搜索过滤", () => {
    const body = extractFunctionSource(paletteSource, "CommandPalette");
    expect(body).toContain("cmd.name.toLowerCase().includes(q)");
    expect(body).toContain("cmd.description.toLowerCase().includes(q)");
    expect(body).toContain("cmd.category.toLowerCase().includes(q)");
  });

  test("3.3 CommandPalette 按 category 分组显示", () => {
    expect(paletteSource).toContain("function groupCommands");
    expect(paletteSource).toContain("categoryOrder");
    expect(paletteSource).toContain('"knowledge"');
    expect(paletteSource).toContain('"analysis"');
    expect(paletteSource).toContain('"command"');
    expect(paletteSource).toContain('"utility"');
  });

  test("3.4 CommandPalette 支持键盘导航 (ArrowUp/Down/Enter/Escape)", () => {
    const body = extractFunctionSource(paletteSource, "CommandPalette");
    expect(body).toContain('case "ArrowDown"');
    expect(body).toContain('case "ArrowUp"');
    expect(body).toContain('case "Enter"');
    expect(body).toContain('case "Escape"');
  });

  test("3.5 CommandPalette 实现模态面板（isOpen 控制）", () => {
    const body = extractFunctionSource(paletteSource, "CommandPalette");
    expect(body).toContain('if (!isOpen) return null');
    expect(body).toContain("role=\"dialog\"");
    expect(body).toContain("aria-modal=\"true\"");
  });

  test("3.6 CommandPalette 三态渲染 (LoadingState / ErrorState / Empty)", () => {
    const body = extractFunctionSource(paletteSource, "CommandPalette");
    expect(body).toContain("isLoading ?");
    expect(body).toContain("<LoadingState />");
    expect(body).toContain("<ErrorState");
    expect(body).toContain("<EmptyState />");
  });

  test("3.7 handleSelect 构建 CLI 命令字符串", () => {
    // handleSelect 使用 useCallback，无法用 extractFunctionSource 提取
    // 直接在源码中搜索关键逻辑
    expect(paletteSource).toContain("command.cliCommand");
    expect(paletteSource).toContain("command.cliArgs");
    expect(paletteSource).toContain(".join(");
    expect(paletteSource).toContain("handleSelect");
    expect(paletteSource).toContain("cliLine");
  });

  test("3.8 命令数据包含常用 Maestro 命令", () => {
    const mcpSource = loadSource(PANELS.mcpProvider);
    // 验证核心命令存在于工具目录中
    expect(mcpSource).toContain("maestro_search");
    expect(mcpSource).toContain("maestro_analyze");
    expect(mcpSource).toContain("maestro_plan");
    expect(mcpSource).toContain("maestro_execute");
    expect(mcpSource).toContain("maestro_brainstorm");
    // 协作命令（最接近 delegate 概念）
    expect(mcpSource).toContain("maestro_collab");
  });

  test("3.9 CATEGORY_LABELS 包含 4 个中文分类", () => {
    expect(typesSource).toContain('knowledge: "知识"');
    expect(typesSource).toContain('analysis: "分析"');
    expect(typesSource).toContain('command: "命令"');
    expect(typesSource).toContain('utility: "工具"');
  });
});

// =========================================================================
// 场景 4: 决策联动流程 — Ralph 决策桥接 + Agent hooks
// =========================================================================

describe("场景 4: 决策联动流程 — Ralph 决策事件 → Agent hooks", () => {
  const bridgeSource = loadSource(PANELS.decisionBridge);
  const wsSource = loadSource(PANELS.websocketEventBus);

  test("4.1 createRalphDecisionBridge 定义决策事件映射", () => {
    expect(bridgeSource).toContain("createRalphDecisionBridge");
    expect(bridgeSource).toContain("decision-node-created");
    expect(bridgeSource).toContain("decision-node-resolved");
    expect(bridgeSource).toContain("decision-node-expired");
  });

  test("4.2 决策事件 → Agent hooks 映射 (Adapter)", () => {
    // onDecisionRequired
    expect(bridgeSource).toContain("onDecisionRequired");
    // onDecisionResolved
    expect(bridgeSource).toContain("onDecisionResolved");
    // onDecisionExpired
    expect(bridgeSource).toContain("onDecisionExpired");
  });

  test("4.3 DecisionNode 类型包含 question/options/selectedOption", () => {
    expect(bridgeSource).toContain("question: string");
    expect(bridgeSource).toContain("options: string[]");
    expect(bridgeSource).toContain("selectedOption");
  });

  test("4.4 支持 WebSocket 文件轮询降级方案", () => {
    expect(bridgeSource).toContain("decision-events.json");
    expect(bridgeSource).toContain("watch");
  });

  test("4.5 WebSocketEventBus 支持频道订阅/发布", () => {
    expect(wsSource).toContain("subscribe");
    expect(wsSource).toContain("publish");
    expect(wsSource).toContain("WebSocketEventBus");
  });

  test("4.6 WebSocketEventBus 有心跳检测机制", () => {
    expect(wsSource).toContain("ping");
    expect(wsSource).toContain("pong");
  });

  test("4.7 CommandChainPanel 渲染决策节点", () => {
    const ccSource = loadSource(PANELS.commandChainPanel);
    expect(ccSource).toContain("<DecisionNodeView");
    expect(ccSource).toContain("decisionNodes");
    expect(ccSource).toContain("决策节点");
  });

  test("4.8 DecisionNodeView 组件存在", () => {
    const decisionNodeFile = join(
      import.meta.dir,
      "..",
      "apps/desktop/src/renderer/components/CommandChainPanel/DecisionNodeView.tsx",
    );
    const dnSource = readFileSync(decisionNodeFile, "utf8");
    expect(dnSource).toContain("node.question");
    expect(dnSource).toContain("node.options");
  });
});

// =========================================================================
// 场景 5: 完整闭环 — 所有组件跨模块协同
// =========================================================================

describe("场景 5: 完整闭环 — 所有组件跨模块协同验证", () => {
  test("5.1 所有 4 个面板组件使用统一的 tRPC 客户端模式", () => {
    const knowledgeBody = extractFunctionSource(
      loadSource(PANELS.knowledgePanel),
      "KnowledgePanel",
    );
    const analysisBody = extractFunctionSource(
      loadSource(PANELS.analysisPanel),
      "AnalysisPanel",
    );
    const paletteBody = extractFunctionSource(
      loadSource(PANELS.commandPalette),
      "CommandPalette",
    );

    // 都使用 electronTrpc 作为 tRPC 客户端
    expect(knowledgeBody).toContain("electronTrpc.");
    expect(analysisBody).toContain("electronTrpc.");
    expect(paletteBody).toContain("electronTrpc.");
  });

  test("5.2 所有面板组件遵循四态渲染模式", () => {
    const knowledgeBody = extractFunctionSource(
      loadSource(PANELS.knowledgePanel),
      "KnowledgePanel",
    );
    const analysisBody = extractFunctionSource(
      loadSource(PANELS.analysisPanel),
      "AnalysisPanel",
    );

    // 公共四态模式：Loading、Error、Empty、Data
    expect(knowledgeBody).toContain("LoadingState");
    expect(knowledgeBody).toContain("ErrorState");
    expect(knowledgeBody).toContain("EmptyState");
    expect(analysisBody).toContain("LoadingState");
    expect(analysisBody).toContain("ErrorState");
    expect(analysisBody).toContain("EmptyState");
  });

  test("5.3 tRPC maestro router 提供 3 个数据端点", () => {
    const routerSource = loadSource(PANELS.maestroRouter);
    expect(routerSource).toContain("knowledge: router({");
    expect(routerSource).toContain("analyze: router({");
    expect(routerSource).toContain("commands: router({");
  });

  test("5.4 MCP provider 提供 4 类工具目录", () => {
    const mcpSource = loadSource(PANELS.mcpProvider);
    // 检查分类常量或工具分类字段
    expect(mcpSource).toContain('"knowledge"');
    expect(mcpSource).toContain('"analysis"');
    expect(mcpSource).toContain('"command"');
    expect(mcpSource).toContain('"utility"');
  });

  test("5.5 MCP provider 至少包含 20 个工具", () => {
    const mcpSource = loadSource(PANELS.mcpProvider);
    // 统计工具条目
    const toolCount = (mcpSource.match(/name: "maestro_/g) || []).length;
    expect(toolCount).toBeGreaterThanOrEqual(20);
  });

  test("5.6 tRPC router 导出类型被 UI 组件引用", () => {
    const analysisTypes = readFileSync(
      join(
        import.meta.dir,
        "..",
        "apps/desktop/src/renderer/components/AnalysisPanel/types.ts",
      ),
      "utf8",
    );
    const paletteTypes = loadSource(
      join(
        import.meta.dir,
        "..",
        "apps/desktop/src/renderer/components/CommandPalette/types.ts",
      ),
    );

    // AnalysisPanel types 从 maestro router 导入类型
    expect(analysisTypes).toContain('from "lib/trpc/routers/maestro"');
    // CommandPalette types 从 maestro router 导入类型
    expect(paletteTypes).toContain('from "lib/trpc/routers/maestro"');
  });

  test("5.7 所有模块之间的数据流路径完整", () => {
    // MCP Provider → tRPC Router → React Components
    // 1. MCP provider 导出 getMaestroToolCatalog
    const mcpSource = loadSource(PANELS.mcpProvider);
    expect(mcpSource).toContain("getMaestroToolCatalog");

    // 2. tRPC router 导入 MCP provider
    const routerSource = loadSource(PANELS.maestroRouter);
    expect(routerSource).toContain("maestro-mcp-provider");

    // 3. React 组件导入 electronTrpc
    const knowledgeSource = loadSource(PANELS.knowledgePanel);
    expect(knowledgeSource).toContain(
      'from "renderer/lib/electron-trpc"',
    );

    const analysisSource = loadSource(PANELS.analysisPanel);
    expect(analysisSource).toContain(
      'from "renderer/lib/electron-trpc"',
    );
  });

  test("5.8 决策桥接与 Agent hooks 的集成点在 agent-setup/index.ts 中", () => {
    const agentSetupIndex = join(
      import.meta.dir,
      "..",
      "apps/desktop/src/main/lib/agent-setup/index.ts",
    );
    const setupSource = readFileSync(agentSetupIndex, "utf8");
    expect(setupSource).toContain("setupAgentHooks");
    expect(setupSource).toContain("createRalphDecisionBridge");
  });
});

// =========================================================================
// 补充：数据契约一致性测试
// =========================================================================

describe("数据契约一致性 — 后端 schema → 前端类型映射", () => {
  const routerSource = loadSource(PANELS.maestroRouter);
  const knowledgePanelSource = loadSource(PANELS.knowledgePanel);
  const analysisTypes = readFileSync(
    join(
      import.meta.dir,
      "..",
      "apps/desktop/src/renderer/components/AnalysisPanel/types.ts",
    ),
    "utf8",
  );

  test("后端 KgSearchResult.type 枚举与前端 mapType 兼容", () => {
    // 后端 schema 的 type: spec|knowhow|wiki|code|artifact
    expect(routerSource).toContain(
      'z.enum(["spec", "knowhow", "wiki", "code", "artifact"])',
    );
    // 前端的 mapType 函数覆盖所有后端类型
    const mapFn = extractFunctionSource(knowledgePanelSource, "mapType");
    expect(mapFn).toContain("spec");
    expect(mapFn).toContain("knowhow");
    expect(mapFn).toContain("wiki");
    expect(mapFn).toContain("code");
    expect(mapFn).toContain("artifact");
  });

  test("后端 AnalyzeResult schema 与前端 mapAnalyzeResult 字段对齐", () => {
    // 后端
    expect(routerSource).toContain("overallScore");
    expect(routerSource).toContain("dimensions");
    expect(routerSource).toContain("risks");
    expect(routerSource).toContain("recommendations");

    // 前端映射
    expect(analysisTypes).toContain("overallScore");
    expect(analysisTypes).toContain("dimensions");
    expect(analysisTypes).toContain("risks");
    expect(analysisTypes).toContain("recommendations");
  });

  test("后端风险项 severity/likelihood 枚举被正确映射", () => {
    expect(routerSource).toContain(
      'z.enum(["low", "medium", "high", "critical"])',
    ); // severity
    expect(routerSource).toContain('z.enum(["low", "medium", "high"])'); // likelihood
    expect(analysisTypes).toContain("mapSeverityToNumber");
    expect(analysisTypes).toContain("mapLikelihoodToNumber");
  });
});
