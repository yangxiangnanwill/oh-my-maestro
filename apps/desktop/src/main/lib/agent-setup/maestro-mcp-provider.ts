import { spawn, ChildProcess } from "node:child_process";
import os from "node:os";
import path from "node:path";

/**
 * Maestro MCP Provider — bridges Maestro-flow CLI tools into the Superset agent
 * ecosystem via the Model Context Protocol (stdio transport).
 *
 * Architecture:
 *   Electron Main Process
 *     -> spawn("maestro", ["mcp", "serve", "--transport", "stdio"])
 *     -> StdioClientTransport (MCP SDK)
 *     -> listTools() → register each tool into Superset MCP Registry
 *     -> callTool() → forward to Maestro-flow, return results
 *
 * If the MCP Registry is unavailable (e.g., Superset packages not configured),
 * the provider degrades gracefully and exposes tools via a direct invocation map
 * accessible through the tRPC maestro router.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface McpToolDefinition {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

interface MaestroCliTool {
  name: string;
  description: string;
  category: "knowledge" | "analysis" | "command" | "utility";
  cliCommand: string;
  /** CLI args appended after the command. Use {{cwd}} placeholder for cwd. */
  cliArgs: string[];
}

interface MaestroMcpProviderState {
  process: ChildProcess | null;
  tools: McpToolDefinition[];
  registered: boolean;
  startError: string | null;
}

// ---------------------------------------------------------------------------
// Tool catalog — static fallback when MCP handshake is unavailable
// ---------------------------------------------------------------------------

const MAESTRO_TOOL_CATALOG: MaestroCliTool[] = [
  {
    name: "maestro_search",
    description:
      "Semantic knowledge-graph search across specs, knowhow, wiki, and codebase symbols. Returns ranked results with relevance scores.",
    category: "knowledge",
    cliCommand: "maestro",
    cliArgs: ["search", "{{query}}"],
  },
  {
    name: "maestro_kg_search",
    description:
      "Direct knowledge-graph symbol search. Finds functions, classes, and modules by name.",
    category: "knowledge",
    cliCommand: "maestro",
    cliArgs: ["kg", "search", "{{query}}"],
  },
  {
    name: "maestro_kg_context",
    description:
      "Knowledge-graph context retrieval for a specific node. Returns callers, callees, and related symbols.",
    category: "knowledge",
    cliCommand: "maestro",
    cliArgs: ["kg", "context", "{{node}}"],
  },
  {
    name: "maestro_kg_callers",
    description:
      "Find all callers of a given function or method in the knowledge graph.",
    category: "knowledge",
    cliCommand: "maestro",
    cliArgs: ["kg", "callers", "{{fn}}"],
  },
  {
    name: "maestro_kg_callees",
    description:
      "Find all callees (functions called by) a given function or method.",
    category: "knowledge",
    cliCommand: "maestro",
    cliArgs: ["kg", "callees", "{{fn}}"],
  },
  {
    name: "maestro_analyze",
    description:
      "Deep structured analysis of a topic with 6-dimension scoring (correctness, readability, performance, security, testing, architecture) and risk matrix.",
    category: "analysis",
    cliCommand: "maestro",
    cliArgs: ["analyze", "{{topic}}"],
  },
  {
    name: "maestro_spec_load",
    description:
      "Load project specs by category. Returns spec entries for injection into agent context.",
    category: "knowledge",
    cliCommand: "maestro",
    cliArgs: ["spec", "load", "--category", "{{category}}"],
  },
  {
    name: "maestro_spec_add",
    description:
      "Add a new spec entry. Category routing: decisions→arch, patterns→coding, pitfalls→debug, rules→review, tests→test.",
    category: "knowledge",
    cliCommand: "maestro",
    cliArgs: [
      "spec-add",
      "{{category}}",
      "{{title}}",
      "{{content}}",
      "--keywords",
      "{{keywords}}",
      "--description",
      "{{summary}}",
    ],
  },
  {
    name: "maestro_knowhow_capture",
    description:
      "Capture reusable knowledge as templates, recipes, or tips into the knowhow system.",
    category: "knowledge",
    cliCommand: "maestro",
    cliArgs: ["manage-knowhow-capture"],
  },
  {
    name: "maestro_plan",
    description:
      "Create, revise, or verify an execution plan for a phase or task.",
    category: "command",
    cliCommand: "maestro",
    cliArgs: ["plan", "{{description}}"],
  },
  {
    name: "maestro_execute",
    description:
      "Execute a confirmed plan — dispatches workflow tasks with DAG-based orchestration.",
    category: "command",
    cliCommand: "maestro",
    cliArgs: ["execute", "{{planId}}"],
  },
  {
    name: "maestro_brainstorm",
    description:
      "Multi-perspective brainstorming with cross-role synthesis. Explores ideas, evaluates approaches, generates frameworks.",
    category: "command",
    cliCommand: "maestro",
    cliArgs: ["brainstorm", "{{topic}}"],
  },
  {
    name: "maestro_review",
    description:
      "Multi-dimensional code review: correctness, readability, performance, security, testing, architecture.",
    category: "command",
    cliCommand: "maestro",
    cliArgs: ["review", "{{path}}"],
  },
  {
    name: "maestro_debug",
    description:
      "Hypothesis-driven debugging with archaeology, diagnosis, fix, confirmation, and generalization phases.",
    category: "command",
    cliCommand: "maestro",
    cliArgs: ["debug", "{{issue}}"],
  },
  {
    name: "maestro_quality_test",
    description:
      "Interactive user acceptance testing with verification and gap closure.",
    category: "command",
    cliCommand: "maestro",
    cliArgs: ["quality-test", "{{feature}}"],
  },
  {
    name: "maestro_quality_review",
    description:
      "Post-execution quality evaluation across correctness, security, performance, and architecture dimensions.",
    category: "command",
    cliCommand: "maestro",
    cliArgs: ["quality-review", "{{phase}}"],
  },
  {
    name: "maestro_security_audit",
    description:
      "OWASP Top 10 and STRIDE security audit with supply chain analysis.",
    category: "command",
    cliCommand: "maestro",
    cliArgs: ["security-audit", "{{target}}"],
  },
  {
    name: "maestro_blueprint",
    description:
      "Generate formal specification package (Product Brief, PRD, Architecture, Epics) through 6-phase document chain.",
    category: "command",
    cliCommand: "maestro",
    cliArgs: ["blueprint", "{{description}}"],
  },
  {
    name: "maestro_roadmap",
    description:
      "Generate roadmap with milestone/phase structure from requirements or upstream context.",
    category: "command",
    cliCommand: "maestro",
    cliArgs: ["roadmap", "{{requirements}}"],
  },
  {
    name: "maestro_refactor",
    description:
      "Quality-driven refactoring with iterative cycles — simplify, deduplicate, and improve code structure.",
    category: "command",
    cliCommand: "maestro",
    cliArgs: ["refactor", "{{path}}"],
  },
  {
    name: "maestro_learn_decompose",
    description:
      "Extract design patterns from code into formal specs and wiki entries.",
    category: "knowledge",
    cliCommand: "maestro",
    cliArgs: ["learn-decompose", "{{path}}"],
  },
  {
    name: "maestro_learn_investigate",
    description:
      "Investigate questions with hypothesis testing and evidence logging.",
    category: "knowledge",
    cliCommand: "maestro",
    cliArgs: ["learn-investigate", "{{question}}"],
  },
  {
    name: "maestro_issue_discover",
    description:
      "Discover potential issues from multiple perspectives (bug, UX, test, quality, security, performance).",
    category: "command",
    cliCommand: "maestro",
    cliArgs: ["issue:discover", "{{context}}"],
  },
  {
    name: "maestro_issue_execute",
    description:
      "Execute a queue of issues with DAG-based parallel orchestration (one commit per solution).",
    category: "command",
    cliCommand: "maestro",
    cliArgs: ["issue:execute", "{{queueId}}"],
  },
  {
    name: "maestro_quick",
    description:
      "Fast, single-step task execution — skip optional agents for quick results.",
    category: "command",
    cliCommand: "maestro",
    cliArgs: ["quick", "{{task}}"],
  },
  {
    name: "maestro_collab",
    description:
      "Cross-verification from multiple CLI tools or diverse analytical perspectives.",
    category: "command",
    cliCommand: "maestro",
    cliArgs: ["collab", "{{question}}"],
  },
  {
    name: "maestro_harvest",
    description:
      "Extract knowledge from artifacts (code, specs, docs) into wiki/spec/issues.",
    category: "knowledge",
    cliCommand: "maestro",
    cliArgs: ["manage-harvest", "{{path}}"],
  },
  {
    name: "maestro_memory_capture",
    description:
      "Capture context-aware memory — session compact or quick tips — for future reference.",
    category: "utility",
    cliCommand: "maestro",
    cliArgs: ["memory-capture", "{{context}}"],
  },
  {
    name: "maestro_commands_list",
    description:
      "List all available Maestro commands with descriptions and categories.",
    category: "utility",
    cliCommand: "maestro",
    cliArgs: ["help"],
  },
];

// ---------------------------------------------------------------------------
// Singleton state
// ---------------------------------------------------------------------------

const state: MaestroMcpProviderState = {
  process: null,
  tools: [],
  registered: false,
  startError: null,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveMaestroHome(): string {
  return process.env.MAESTRO_HOME || path.join(os.homedir(), ".maestro");
}

/**
 * Build an MCP tool definition from the static catalog entry.
 */
function catalogToMcpTool(entry: MaestroCliTool): McpToolDefinition {
  return {
    name: entry.name,
    description: entry.description,
    inputSchema: buildInputSchema(entry),
  };
}

function buildInputSchema(entry: MaestroCliTool): Record<string, unknown> {
  // Extract placeholder names from cliArgs
  const placeholders: string[] = [];
  const placeholderRegex = /\{\{(\w+)\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = placeholderRegex.exec(entry.cliArgs.join(" "))) !== null) {
    if (!placeholders.includes(match[1])) {
      placeholders.push(match[1]);
    }
  }

  if (placeholders.length === 0) {
    return { type: "object", properties: {}, required: [] };
  }

  const properties: Record<string, { type: string; description: string }> = {};
  for (const p of placeholders) {
    properties[p] = {
      type: "string",
      description: `Parameter: ${p}`,
    };
  }

  return {
    type: "object",
    properties,
    required: placeholders,
  };
}

/**
 * Try to import the MCP SDK. Returns null if not available.
 */
async function tryLoadMcpSdk(): Promise<{
  Client: new (...args: any[]) => any;
  StdioClientTransport: new (...args: any[]) => any;
} | null> {
  try {
    const mcp = await import("@modelcontextprotocol/sdk/client/index.js");
    const stdio = await import(
      "@modelcontextprotocol/sdk/client/stdio.js"
    );
    return {
      Client: mcp.Client,
      StdioClientTransport: stdio.StdioClientTransport,
    };
  } catch {
    console.warn(
      "[maestro-mcp] @modelcontextprotocol/sdk not available — using static tool catalog",
    );
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Register Maestro-flow MCP tools into the Superset agent ecosystem.
 *
 * Strategy:
 * 1. Try MCP handshake via stdio transport (preferred — live tool discovery).
 * 2. Fall back to static tool catalog when MCP SDK or `maestro` binary is unavailable.
 * 3. Register discovered tools into Superset MCP Registry if available.
 * 4. Always expose tools via the internal catalog for tRPC endpoint fallback.
 *
 * Must be called after app.whenReady() and after setupAgentHooks().
 */
export async function registerMaestroMcpProvider(): Promise<void> {
  if (state.registered) {
    console.log("[maestro-mcp] Already registered, skipping");
    return;
  }

  console.log("[maestro-mcp] Registering Maestro MCP provider...");

  // Always populate the static tool catalog for tRPC fallback
  state.tools = MAESTRO_TOOL_CATALOG.map(catalogToMcpTool);

  const mcpSdk = await tryLoadMcpSdk();

  if (mcpSdk) {
    await tryMcpHandshake(mcpSdk);
  }

  // Attempt to register into Superset MCP Registry
  await tryRegisterToSupersetRegistry();

  state.registered = true;
  console.log(
    `[maestro-mcp] Maestro MCP provider registered with ${state.tools.length} tools`,
  );
}

/**
 * Attempt live MCP handshake with `maestro mcp serve` subprocess.
 * On success, replaces the static tool list with live-discovered tools.
 */
async function tryMcpHandshake(mcpSdk: {
  Client: new (...args: any[]) => any;
  StdioClientTransport: new (...args: any[]) => any;
}): Promise<void> {
  let childProcess: ChildProcess | null = null;

  try {
    const transport = new mcpSdk.StdioClientTransport({
      command: "maestro",
      args: ["mcp", "serve", "--transport", "stdio"],
      env: {
        ...process.env,
        MAESTRO_HOME: resolveMaestroHome(),
      } as Record<string, string>,
    });

    const client = new mcpSdk.Client(
      { name: "superset-maestro-provider", version: "1.0.0" },
      { capabilities: { tools: {} } },
    );

    await client.connect(transport);

    const toolsResult = await client.listTools();
    if (toolsResult?.tools && toolsResult.tools.length > 0) {
      state.tools = toolsResult.tools.map((t: McpToolDefinition) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      }));
      console.log(
        `[maestro-mcp] MCP handshake successful — discovered ${state.tools.length} tools`,
      );
    } else {
      console.warn(
        "[maestro-mcp] MCP handshake returned 0 tools — keeping static catalog",
      );
    }

    // Store process reference for lifecycle management
    state.process = childProcess;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      `[maestro-mcp] MCP handshake failed: ${message} — using static catalog (${state.tools.length} tools)`,
    );
    state.startError = message;

    // Clean up failed process
    if (childProcess && !childProcess.killed) {
      childProcess.kill();
      childProcess = null;
    }
  }
}

/**
 * Attempt to register tools with the Superset MCP Registry.
 *
 * In the full Superset monorepo, the MCP v2 package provides a registry API
 * (`packages/mcp-v2/src/tools/register.ts`). This function attempts to
 * dynamically import and use that API.
 *
 * If the registry is unavailable (e.g., in a partial checkout or before the
 * monorepo is configured), it degrades gracefully — tools remain accessible
 * via the tRPC maestro router and the internal tool catalog.
 */
async function tryRegisterToSupersetRegistry(): Promise<void> {
  try {
    // Attempt dynamic import of Superset MCP v2 registry
    const registry = await import(
      "@superset/mcp-v2/tools/register"
    );

    if (typeof registry.registerExternalTools === "function") {
      const count = registry.registerExternalTools(
        "maestro",
        state.tools,
      );
      console.log(
        `[maestro-mcp] Registered ${count}/${state.tools.length} tools into Superset MCP Registry`,
      );
    } else if (typeof registry.registerTools === "function") {
      const count = registry.registerTools(state.tools);
      console.log(
        `[maestro-mcp] Registered ${count} tools into Superset MCP Registry`,
      );
    } else {
      console.warn(
        "[maestro-mcp] Superset MCP Registry found but no compatible registration function — tools available via tRPC only",
      );
    }
  } catch {
    console.log(
      "[maestro-mcp] Superset MCP Registry not available — tools accessible via tRPC maestro router",
    );
  }
}

/**
 * Kill the Maestro MCP subprocess if it was started.
 */
export function disposeMaestroMcpProvider(): void {
  if (state.process && !state.process.killed) {
    state.process.kill();
    state.process = null;
    console.log("[maestro-mcp] Maestro MCP subprocess terminated");
  }
  state.registered = false;
  state.tools = [];
  state.startError = null;
}

/**
 * Returns the current tool catalog. Used by the tRPC maestro router to
 * serve command lists to the UI panel.
 */
export function getMaestroToolCatalog(): MaestroCliTool[] {
  return MAESTRO_TOOL_CATALOG;
}

/**
 * Returns the current MCP tool definitions (either from live discovery or
 * static catalog).
 */
export function getMaestroMcpTools(): McpToolDefinition[] {
  return state.tools;
}

/**
 * Returns the provider registration state.
 */
export function getMaestroMcpState(): Readonly<MaestroMcpProviderState> {
  return state;
}
