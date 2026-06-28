# TASK-002: AgentSelect useMemo + EditToolExpandedDiff useMemo

## 变更
- `AgentSelect.tsx`: selectableIds 用 useMemo 包裹，依赖 [agents] (PERF-003)
- `EditToolExpandedDiff.tsx`: contents 用 useMemo 包裹，依赖 [oldString, newString] (PERF-004)

## 验证
- [x] `bun run typecheck` exit 0
- [x] AgentSelect 中 selectableIds 仅在 agents 变化时重建
- [x] EditToolExpandedDiff 中 contents 仅在 oldString/newString 变化时重建
