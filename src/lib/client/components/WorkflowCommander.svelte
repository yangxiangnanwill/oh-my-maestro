<script lang="ts">
  import { activeWorkflows, connectionState, wsClient } from '$lib/client/stores/index.js';
  import type { WorkflowExecution, WorkflowMeta, ApprovalGate } from '$lib/shared/types.js';
  import { Channels, GateEvents } from '$lib/shared/events.js';
  import ApprovalPanel from './ApprovalPanel.svelte';

  let workflows: WorkflowMeta[] = $state([]);
  let loading: boolean = $state(true);
  let error: string | null = $state(null);
  let selectedExecutionId: string | null = $state(null);

  // ── 审批门控状态 ──
  let showApprovalPanel: boolean = $state(false);
  let currentGateId: string | null = $state(null);
  let currentGate: ApprovalGate | null = $state(null);

  let activeExecutions: WorkflowExecution[] = $derived(
    $activeWorkflows.filter((w) => w.status !== 'completed' && w.status !== 'cancelled')
  );

  let selectedExecution: WorkflowExecution | undefined = $derived(
    selectedExecutionId
      ? $activeWorkflows.find((w) => w.id === selectedExecutionId)
      : undefined
  );

  $effect(() => {
    fetch('/api/workflows')
      .then((r) => r.json())
      .then((data: { workflows: WorkflowMeta[] }) => {
        workflows = data.workflows;
        loading = false;
      })
      .catch((e: Error) => {
        error = e.message;
        loading = false;
      });
  });

  async function executeWorkflow(workflow: WorkflowMeta): Promise<void> {
    try {
      // Step 1: POST /api/workflows/execute — 触发 dry-run + 创建门控
      const response = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId: workflow.id, params: {} }),
      });

      const data = await response.json() as {
        executionId?: string;
        gateId?: string;
        status?: string;
        error?: string;
      };

      if (data.error) {
        error = data.error;
        return;
      }

      if (data.gateId && data.status === 'pending') {
        // Step 2: 展示 ApprovalPanel
        currentGateId = data.gateId;
        showApprovalPanel = true;

        // 监听 gate:pending 事件获取完整 gate 对象
        const unsub = wsClient.on(Channels.GATE, (message) => {
          if (message.type === GateEvents.PENDING) {
            const gate = message.payload as ApprovalGate;
            if (gate.gateId === currentGateId) {
              currentGate = gate;
            }
          }

          // 监听 gate:resolved 事件
          if (message.type === GateEvents.RESOLVED) {
            const resolvedGate = message.payload as ApprovalGate;
            if (resolvedGate.gateId === currentGateId) {
              currentGate = resolvedGate;
              // 批准后追踪执行
              if (resolvedGate.status === 'approved') {
                selectedExecutionId = resolvedGate.executionId;
              }
            }
          }
        });

        // 存储 unsubscribe 函数，在面板关闭时调用
        // (wsClient.on 返回 unsubscribe 函数)
        // 此处依赖闭包保持 unsub 引用
      } else if (data.executionId) {
        // 无门控流程（向后兼容）
        selectedExecutionId = data.executionId;
      }
    } catch (e) {
      error = (e as Error).message;
    }
  }

  // ── 审批面板回调 ──
  function handleApprove(gateId: string): void {
    fetch(`/api/gates/${gateId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved: true }),
    })
      .then((r) => r.json())
      .catch((e: Error) => {
        error = e.message;
      });
  }

  function handleReject(gateId: string): void {
    fetch(`/api/gates/${gateId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved: false }),
    })
      .then((r) => r.json())
      .catch((e: Error) => {
        error = e.message;
      });
  }

  function handleDismiss(gateId: string): void {
    showApprovalPanel = false;
    currentGateId = null;
    currentGate = null;
  }

  function getStatusIcon(status: string): string {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'running':
        return '\u{1F504}';
      case 'complete':
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      case 'skipped':
        return '⏭️';
      default:
        return '○';
    }
  }

  function getDisplayName(item: { name: string; translatedName?: string }): string {
    return item.translatedName ?? item.name;
  }
</script>

<div class="workflow-commander">
  <div class="connection-indicator" class:connected={$connectionState.connected} class:disconnected={!$connectionState.connected}>
    <span class="indicator-dot">{$connectionState.connected ? '●' : '○'}</span>
    <span class="indicator-text">{$connectionState.connected ? 'Connected' : 'Disconnected'}</span>
  </div>

  <div class="two-panel">
    <!-- Left panel: workflow card list -->
    <div class="panel-left">
      <h2 class="panel-title">Workflows</h2>

      {#if loading}
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading workflows...</p>
        </div>
      {:else if error}
        <div class="error-state">
          <p class="error-text">{error}</p>
          <button class="retry-btn" onclick={() => { loading = true; error = null; fetch('/api/workflows').then(r => r.json()).then((data: { workflows: WorkflowMeta[] }) => { workflows = data.workflows; loading = false; }).catch((e: Error) => { error = e.message; loading = false; }); }}>Retry</button>
        </div>
      {:else if workflows.length === 0}
        <div class="empty-state">
          <p>No workflows available</p>
        </div>
      {:else}
        <div class="card-list">
          {#each workflows as workflow (workflow.id)}
            <div class="workflow-card">
              <span class="category-badge">{workflow.category}</span>
              <h3 class="card-name">{getDisplayName(workflow)}</h3>
              <p class="card-desc">{workflow.description}</p>
              <button
                class="run-btn"
                onclick={() => executeWorkflow(workflow)}
                disabled={!$connectionState.connected}
              >
                Run
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Right panel: execution progress -->
    <div class="panel-right">
      <h2 class="panel-title">Execution</h2>

      {#if selectedExecution}
        <div class="execution-header">
          <span class="execution-id">{selectedExecution.id}</span>
          <span class="execution-status" class:status-running={selectedExecution.status === 'running'} class:status-completed={selectedExecution.status === 'completed'} class:status-failed={selectedExecution.status === 'failed'}>
            {selectedExecution.status}
          </span>
        </div>
        <div class="step-list">
          {#each selectedExecution.steps as step (step.index)}
            <div class="step-row" class:step-pending={step.status === 'pending'} class:step-running={step.status === 'running'} class:step-complete={step.status === 'complete'} class:step-failed={step.status === 'failed'}>
              <span class="step-icon">{getStatusIcon(step.status)}</span>
              <span class="step-name">{getDisplayName(step)}</span>
              {#if step.output}
                <details class="step-output">
                  <summary>Output</summary>
                  <pre>{step.output}</pre>
                </details>
              {/if}
            </div>
          {/each}
        </div>

        <!-- Active executions switcher -->
        {#if activeExecutions.length > 1}
          <div class="execution-switcher">
            <h4>Active Executions</h4>
            {#each activeExecutions as exec (exec.id)}
              <button
                class="exec-tab"
                class:active={exec.id === selectedExecutionId}
                onclick={() => selectedExecutionId = exec.id}
              >
                {exec.id.slice(0, 8)}... ({exec.status})
              </button>
            {/each}
          </div>
        {/if}
      {:else if activeExecutions.length > 0}
        <div class="execution-list">
          <p class="list-hint">Active executions:</p>
          {#each activeExecutions as exec (exec.id)}
            <button
              class="exec-tab"
              onclick={() => selectedExecutionId = exec.id}
            >
              {exec.id.slice(0, 8)}... ({exec.status})
            </button>
          {/each}
        </div>
        <div class="placeholder">
          <p>Select an execution to view progress</p>
        </div>
      {:else}
        <div class="placeholder">
          <p>Select a workflow to run</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Approval Panel (Phase 3: gate gating UI) -->
  {#if showApprovalPanel && currentGate}
    <ApprovalPanel
      gate={currentGate}
      onApprove={handleApprove}
      onReject={handleReject}
      onDismiss={handleDismiss}
    />
  {/if}
</div>

<style>
  .workflow-commander {
    display: flex;
    flex-direction: column;
    height: 100%;
    font-size: 13px;
    color: #cdd6f4;
  }

  /* Connection indicator */
  .connection-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    font-size: 12px;
    border-bottom: 1px solid #313244;
    background: #181825;
  }

  .connection-indicator.connected {
    color: #a6e3a1;
  }

  .connection-indicator.disconnected {
    color: #f38ba8;
  }

  .indicator-dot {
    font-size: 10px;
  }

  /* Two-panel layout */
  .two-panel {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .panel-left,
  .panel-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    padding: 16px;
  }

  .panel-left {
    border-right: 1px solid #313244;
  }

  .panel-title {
    font-size: 12px;
    text-transform: uppercase;
    color: #6c7086;
    margin: 0 0 12px 0;
    letter-spacing: 0.5px;
  }

  /* Loading state */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
    color: #6c7086;
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid #313244;
    border-top: 2px solid #89b4fa;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 8px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Error state */
  .error-state {
    padding: 16px;
    background: rgba(243, 139, 168, 0.1);
    border: 1px solid #f38ba8;
    border-radius: 6px;
    text-align: center;
  }

  .error-text {
    color: #f38ba8;
    margin: 0 0 8px 0;
    font-size: 13px;
  }

  .retry-btn {
    padding: 4px 12px;
    border: 1px solid #f38ba8;
    border-radius: 4px;
    background: transparent;
    color: #f38ba8;
    cursor: pointer;
    font-size: 12px;
  }

  .retry-btn:hover {
    background: rgba(243, 139, 168, 0.15);
  }

  /* Empty / placeholder */
  .empty-state,
  .placeholder {
    text-align: center;
    padding: 32px 8px;
    color: #6c7086;
  }

  /* Card list */
  .card-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .workflow-card {
    background: #313244;
    border: 1px solid #45475a;
    border-radius: 8px;
    padding: 14px;
    transition: border-color 0.15s ease, background-color 0.15s ease;
  }

  .workflow-card:hover {
    border-color: #cba6f7;
    background: #363848;
  }

  .category-badge {
    display: inline-block;
    padding: 2px 8px;
    font-size: 11px;
    border-radius: 10px;
    background: rgba(203, 166, 247, 0.15);
    color: #cba6f7;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .card-name {
    font-size: 14px;
    font-weight: 600;
    color: #cdd6f4;
    margin: 0 0 4px 0;
  }

  .card-desc {
    font-size: 12px;
    color: #a6adc8;
    margin: 0 0 10px 0;
    line-height: 1.4;
  }

  .run-btn {
    padding: 6px 16px;
    border: 1px solid #89b4fa;
    border-radius: 4px;
    background: rgba(137, 180, 250, 0.1);
    color: #89b4fa;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: background-color 0.15s ease;
  }

  .run-btn:hover:not(:disabled) {
    background: rgba(137, 180, 250, 0.2);
  }

  .run-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Execution panel */
  .execution-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    padding: 8px 10px;
    background: #313244;
    border-radius: 6px;
  }

  .execution-id {
    font-family: monospace;
    font-size: 12px;
    color: #cdd6f4;
  }

  .execution-status {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    padding: 2px 6px;
    border-radius: 3px;
    background: #45475a;
    color: #cdd6f4;
  }

  .execution-status.status-running {
    background: rgba(137, 180, 250, 0.2);
    color: #89b4fa;
  }

  .execution-status.status-completed {
    background: rgba(166, 227, 161, 0.2);
    color: #a6e3a1;
  }

  .execution-status.status-failed {
    background: rgba(243, 139, 168, 0.2);
    color: #f38ba8;
  }

  /* Step list */
  .step-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .step-row {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px;
    padding: 8px 10px;
    border-radius: 4px;
    border-left: 3px solid #45475a;
    transition: background-color 0.15s ease;
  }

  .step-row:hover {
    background: rgba(49, 50, 68, 0.5);
  }

  .step-row.step-pending {
    border-left-color: #f9e2af;
  }

  .step-row.step-running {
    border-left-color: #89b4fa;
  }

  .step-row.step-complete {
    border-left-color: #a6e3a1;
  }

  .step-row.step-failed {
    border-left-color: #f38ba8;
  }

  .step-icon {
    font-size: 14px;
    flex-shrink: 0;
  }

  .step-name {
    font-size: 13px;
    color: #cdd6f4;
  }

  .step-row.step-running .step-name {
    color: #89b4fa;
  }

  .step-row.step-complete .step-name {
    color: #a6e3a1;
  }

  .step-row.step-failed .step-name {
    color: #f38ba8;
  }

  .step-row.step-running .step-icon {
    animation: spin 1s linear infinite;
  }

  .step-output {
    width: 100%;
    margin-top: 4px;
  }

  .step-output summary {
    font-size: 11px;
    color: #6c7086;
    cursor: pointer;
  }

  .step-output pre {
    font-size: 11px;
    color: #a6adc8;
    background: #181825;
    padding: 8px;
    border-radius: 4px;
    margin: 4px 0 0 0;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
  }

  /* Execution switcher */
  .execution-switcher,
  .execution-list {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #313244;
  }

  .execution-switcher h4,
  .list-hint {
    font-size: 11px;
    text-transform: uppercase;
    color: #6c7086;
    margin: 0 0 8px 0;
  }

  .exec-tab {
    display: inline-block;
    padding: 4px 10px;
    margin: 0 4px 4px 0;
    border: 1px solid #45475a;
    border-radius: 4px;
    background: #313244;
    color: #cdd6f4;
    cursor: pointer;
    font-size: 11px;
    font-family: monospace;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }

  .exec-tab:hover {
    background: #45475a;
  }

  .exec-tab.active {
    border-color: #cba6f7;
    background: rgba(203, 166, 247, 0.1);
    color: #cba6f7;
  }

  /* Responsive */
  @media (max-width: 700px) {
    .two-panel {
      flex-direction: column;
    }

    .panel-left {
      border-right: none;
      border-bottom: 1px solid #313244;
    }
  }
</style>
