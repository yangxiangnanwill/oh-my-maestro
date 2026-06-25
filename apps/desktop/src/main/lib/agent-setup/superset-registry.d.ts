// Phase 3 stub — declare @superset/mcp-v2/tools/register for typecheck
// The actual dynamic import in maestro-mcp-provider.ts is try-catch guarded
declare module "@superset/mcp-v2/tools/register" {
  export function registerExternalTools(
    source: string,
    tools: unknown[],
  ): number;
  export function registerTools(tools: unknown[]): number;
}
