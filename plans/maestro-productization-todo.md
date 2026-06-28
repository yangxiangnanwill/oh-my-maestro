# Maestro Productization TODO

Use this file as the execution checklist when switching between Claude Code, CodePlan or other low-cost models, and Codex.

## Rule Of Execution

Never run the whole workflow in one pass.

Each round must stop at the named stop point, commit or report the result, and return to Codex for review before moving to the next round.

## Setup

Start from the rebuild worktree:

```powershell
cd D:\WorkSpace\VsCode\oh-my-maestro-rebuild
git status
git pull
```

Open this folder in Claude Code.

Read the workflow:

```text
/maestro-next plans/maestro-productization-workflow.md
```

Then run only the current round from this TODO.

## Round 1: Analysis And Drafts

### Claude Code Prompt

```text
Read plans/maestro-productization-workflow.md and plans/maestro-productization-todo.md.

Execute Round 1 only.

Goal:
- Analyze the current Electron shell.
- Produce a command registry draft from current Maestro CLI usage.
- Produce a Superset concept mapping for Oh My Maestro.

Hard stops:
- Do not implement UI.
- Do not change IPC.
- Do not introduce Superset runtime.
- Do not delete old code.
- Stop after producing the Round 1 artifacts.

Expected artifacts:
- plans/generated/command-registry-draft.md
- plans/generated/superset-concept-mapping.md
- plans/generated/round-1-review-notes.md

After artifacts are written, stop and summarize what Codex should review.
```

### Allowed Work

- Read source files.
- Run `maestro --help`, `maestro ralph --help`, `maestro search --help`, `maestro load --help`.
- Use CodePlan, DeepSeek, or GLM to extract command metadata.
- Write markdown planning artifacts under `plans/generated/`.

### Stop Point

Stop when these files exist:

- `plans/generated/command-registry-draft.md`
- `plans/generated/superset-concept-mapping.md`
- `plans/generated/round-1-review-notes.md`

### Return To Codex

Ask Codex to review:

- Whether the command registry shape is safe.
- Which commands should be read-only MVP commands.
- Whether the Superset mapping avoids runtime dependency creep.
- Whether Round 2 should implement registry-only or include parser models.

## Round 2: Registry Implementation

Start Round 2 only after Codex approves Round 1.

### Claude Code Prompt

```text
Read plans/generated/command-registry-draft.md and Codex review notes.

Execute Round 2 only.

Goal:
- Implement a typed command registry.
- Render current quick actions from the registry.
- Keep IPC whitelist explicit and safe.

Hard stops:
- Do not add Superset runtime.
- Do not add destructive commands.
- Do not support arbitrary command args.
- Stop after typecheck and build pass.

Expected artifacts:
- apps/desktop/src/renderer/lib/commands/commands.registry.ts
- updated renderer quick actions using the registry
- updated main-process validation if needed

Validation:
- cd apps/desktop
- bun run typecheck
- bun run build

After validation, stop and summarize what Codex should review.
```

### Allowed Work

- Add typed registry files.
- Update renderer to use registry entries for existing buttons.
- Update IPC validation only for reviewed read-only commands.
- Add small parser or helper files only if required by registry display.

### Stop Point

Stop when:

- `bun run typecheck` passes.
- `bun run build` passes.
- No unreviewed write/destructive command is exposed.

### Return To Codex

Ask Codex to review:

- IPC command whitelist.
- Registry type shape.
- UI behavior parity with the current shell.
- Whether to commit or adjust.

## Round 3: Workflow State Model

Start Round 3 only after Codex approves and commits Round 2.

### Claude Code Prompt

```text
Read plans/maestro-productization-workflow.md and Codex review notes from Round 2.

Execute Round 3 only.

Goal:
- Define typed workflow state models.
- Parse available Maestro-flow state/status files.
- Convert missing files into explicit UI states.

Hard stops:
- Do not redesign the whole UI.
- Do not call arbitrary shell commands.
- Do not make missing .workflow/state.json an error state.

Expected artifacts:
- typed workflow state model files
- parser fixtures or examples
- renderer output using normalized state

Validation:
- cd apps/desktop
- bun run typecheck
- bun run build

After validation, stop and summarize what Codex should review.
```

### Stop Point

Stop when:

- State parsing handles `.workflow/state.json`, `status.json`, and `chains/singles/status.json`.
- Missing state is displayed as "not initialized" or "no data".
- `typecheck` and `build` pass.

### Return To Codex

Ask Codex to review:

- Parser correctness.
- Error handling.
- Test gaps.
- Whether to add tests before moving on.

## Round 4: Product Panels MVP

Start Round 4 only after Codex approves and commits Round 3.

### Claude Code Prompt

```text
Read plans/maestro-productization-workflow.md and Codex review notes from Round 3.

Execute Round 4 only.

Goal:
- Turn the minimal shell into an MVP product workspace.
- Add product panels using existing live CLI data and mocked data where live data is not available.

Panels:
- Command Center
- Ralph Panel
- Knowledge Panel
- Workflow State Panel
- Visualization Panel

Hard stops:
- Do not import Superset runtime.
- Do not build a landing page.
- Do not add large new dependencies without review.
- Stop when panels render and build passes.

Validation:
- cd apps/desktop
- bun run typecheck
- bun run build

After validation, stop and summarize what Codex should review.
```

### Stop Point

Stop when:

- The app has the 5 panels listed above.
- The panels can render from current CLI output or mock data.
- `typecheck` and `build` pass.

### Return To Codex

Ask Codex to review:

- Product structure.
- UI complexity.
- Data boundaries.
- Next merge strategy.

## Round 5: Superset-Inspired Visualization

Start Round 5 only after Codex approves and commits Round 4.

### Claude Code Prompt

```text
Read plans/generated/superset-concept-mapping.md and Codex review notes from Round 4.

Execute Round 5 only.

Goal:
- Implement Superset-inspired visualization concepts without embedding Superset runtime.

Allowed concepts:
- dashboard-like workspace
- chart-like workflow widgets
- dataset-like command output sources
- explore-like command output explorer
- saved command presets

Hard stops:
- Do not install or embed Apache Superset.
- Do not add backend services.
- Do not implement auth or permissions.
- Stop after MVP visualization works and build passes.

Validation:
- cd apps/desktop
- bun run typecheck
- bun run build

After validation, stop and summarize what Codex should review.
```

### Stop Point

Stop when:

- Visualization is driven by Maestro-flow command/state data.
- Superset remains a concept reference only.
- `typecheck` and `build` pass.

### Return To Codex

Ask Codex to review:

- Whether the product is ready to merge into the main worktree.
- Whether old Superset migration code can be deleted.
- Whether a PR should be opened or updated.

## Global Stop Conditions

Stop immediately and return to Codex if any of these happen:

- Claude Code wants to introduce Superset runtime.
- A generated plan touches Electron main-process command execution without review.
- A command registry entry is write/destructive.
- `bun run typecheck` fails after 2 fix attempts.
- `bun run build` fails after 2 fix attempts.
- The diff touches unrelated files outside the active round.
- The model cannot explain why a new dependency is needed.

## Commit Policy

Claude Code may commit only after:

- The current round stop point is reached.
- `git status --short` contains only expected files.
- `bun run typecheck` passes when code changed.
- `bun run build` passes when app code changed.

Commit message format:

```text
feat: 实现命令注册表
docs: 增加产品化分析草案
refactor: 接入 workflow 状态模型
```

If unsure, do not commit. Return to Codex.

