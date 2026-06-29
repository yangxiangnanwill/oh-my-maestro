import { electronTrpc } from "renderer/lib/electron-trpc";

/**
 * 共享的 workflow state 查询 hook。
 *
 * 两个面板 (WorkflowStatePanel + VisualizationPanel) 使用相同的
 * trpc.maestro.workflow.state.useQuery 查询 key，React Query 会
 * 自动去重，避免重复网络请求。
 */
export function useWorkflowState(cwd: string) {
  return electronTrpc.maestro.workflow.state.useQuery({ cwd }, {});
}
