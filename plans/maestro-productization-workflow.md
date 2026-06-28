# Maestro Productization Workflow

This workflow turns Maestro-flow into a visual product shell while using low-cost models for repetitive extraction and migration work.

## Goal

Build Oh My Maestro as a desktop product that keeps Maestro-flow as the execution engine and borrows Superset's visualization concepts without embedding Superset runtime first.

## Operating Rule

Use Codex or Claude Code for architecture, security boundaries, IPC, typed integration, and final review.

Use DeepSeek, GLM 5.1, or iFlytek CodePlan for repetitive work:

- Extract CLI command metadata from help output.
- Convert docs and command descriptions into JSON.
- Draft UI copy and component variants.
- Summarize Superset dashboard, chart, dataset, and explore concepts.
- Generate mock data and parser fixtures.
- Port simple components after a typed target interface already exists.

## Source Inputs

- Maestro-flow source: `D:\WorkSpace\Source\maestro-flow`
- Desktop shell: `apps/desktop`
- Current product branch: `rebuild/maestro-visual-shell`
- Primary UI target: Electron + React desktop app
- Engine access: local `maestro` CLI through main-process adapter

## Phase 1: Command Inventory

Purpose: create a structured command registry so the UI no longer hardcodes every command.

Codex / Claude Code owns:

- Define `CommandDefinition` TypeScript interface.
- Define safe args policy for IPC.
- Wire registry-driven actions into the renderer.
- Review generated entries before use.

Low-cost model owns:

- Run or consume outputs from:
  - `maestro --help`
  - `maestro ralph --help`
  - `maestro search --help`
  - `maestro load --help`
- Produce command entries with `id`, `label`, `category`, `args`, `description`, `outputKind`, and `riskLevel`.

Expected artifact:

```ts
export interface CommandDefinition {
	id: string;
	label: string;
	category: "workflow" | "ralph" | "knowledge" | "project" | "debug";
	args: string[];
	description: string;
	outputKind: "text" | "json" | "state" | "table";
	riskLevel: "read" | "write" | "destructive";
}
```

Checkpoint:

- No generated command can reach IPC until Codex / Claude Code verifies the args whitelist.

## Phase 2: Workflow State Model

Purpose: normalize Maestro-flow files and CLI output into UI data models.

Codex / Claude Code owns:

- Define typed state models.
- Build parsers with graceful fallback.
- Add tests for missing files and malformed output.

Low-cost model owns:

- Collect sample outputs and status files.
- Label fields and propose mappings.
- Generate parser fixtures.

Expected models:

- `WorkflowProject`
- `WorkflowRun`
- `CommandChain`
- `RalphSession`
- `KnowledgeSearchResult`

Checkpoint:

- UI must show "not initialized" or "no data" as a product state, not as raw `ENOENT`.

## Phase 3: Superset Concept Mapping

Purpose: borrow Superset's useful product abstractions without inheriting its runtime complexity.

Codex / Claude Code owns:

- Decide which concepts become first-class app models.
- Keep integration independent from Superset backend.
- Reject concepts that add migration cost without MVP value.

Low-cost model owns:

- Summarize Superset concepts:
  - dashboard
  - chart
  - dataset
  - explore
  - saved query
  - filter state
- Map each concept to Maestro product equivalents.

Recommended mapping:

| Superset concept | Oh My Maestro equivalent |
| --- | --- |
| Dashboard | Workspace overview |
| Chart | Workflow widget |
| Dataset | Command output source |
| Explore | Visual command/output explorer |
| Saved query | Saved command preset |
| Filter state | Project/session/time filter |

Checkpoint:

- MVP should implement the equivalent model, not import Superset runtime.

## Phase 4: Product Surfaces

Purpose: build the first useful desktop experience.

Initial surfaces:

- Command center: registry-driven command launcher.
- Workflow board: project status, chain status, recent runs.
- Ralph panel: session, check, skills, next task.
- Knowledge panel: search and load results.
- Visualization panel: timeline, DAG, cards, and tables.

Codex / Claude Code owns:

- Component boundaries.
- State management.
- tRPC or IPC shape.
- Error and loading states.

Low-cost model owns:

- Draft component copy.
- Generate mock records.
- Propose table columns and empty states.
- Convert repeated UI patterns after one canonical component exists.

Checkpoint:

- Every panel must work with mocked data and with live CLI output.

## Phase 5: Review, Test, and Merge

Codex / Claude Code owns:

- Run `bun run typecheck`.
- Run `bun run build`.
- Add focused tests for parser and registry behavior.
- Review generated code for unsafe command execution.
- Merge back from worktree only after the branch stays green.

Low-cost model owns:

- Draft test cases.
- Generate fixture files.
- Summarize manual QA steps.

Checkpoint:

- No direct renderer shell execution.
- Main process only runs whitelisted commands.
- Missing local Maestro-flow state is handled as expected UI state.

## Claude Code Prompt For Low-Cost Delegation

Use this prompt when asking CodePlan, DeepSeek, or GLM to do repetitive extraction:

```text
You are preparing structured data for Oh My Maestro.

Do not design architecture. Do not change IPC or security-sensitive code.

Input:
- Maestro CLI help output or Maestro-flow documentation.

Task:
- Extract command or product metadata.
- Return JSON or TypeScript object literals only.
- Include uncertain fields as null.
- Mark destructive or write commands with riskLevel: "write" or "destructive".

Output shape:
{
  "commands": [
    {
      "id": "string",
      "label": "string",
      "category": "workflow|ralph|knowledge|project|debug",
      "args": ["string"],
      "description": "string",
      "outputKind": "text|json|state|table",
      "riskLevel": "read|write|destructive",
      "notes": "string|null"
    }
  ]
}
```

## Maestro Commands To Use During This Workflow

Use these before coding or review work:

```powershell
maestro search "command registry"
maestro search "workflow visualization"
maestro load --type spec --category arch
maestro load --type spec --category coding
```

Use these for current engine validation:

```powershell
maestro ralph session
maestro ralph check
maestro ralph skills
maestro search "Maestro-flow"
```

