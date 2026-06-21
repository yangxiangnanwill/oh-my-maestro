<script lang="ts">
  import { displayMode, connectionState, projectState } from '$lib/client/stores/index.js';
  import ProjectRadar from '$lib/client/components/ProjectRadar.svelte';
  import WorkflowCommander from '$lib/client/components/WorkflowCommander.svelte';

  let mode: 'simple' | 'advanced' = $state('simple');
  let connected = $state(false);

  // Sync with stores
  $effect(() => {
    displayMode.set(mode);
  });

  $effect(() => {
    const unsub = connectionState.subscribe(($state) => {
      connected = $state.connected;
    });
    return unsub;
  });

  // Load project state on mount
  $effect(() => {
    fetch('/api/project/state')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.projectId) projectState.set(data);
      })
      .catch((err) => console.error('[App] Failed to load project state:', err));
  });

  function toggleMode() {
    mode = mode === 'simple' ? 'advanced' : 'simple';
  }
</script>

<div class="app-container">
  <!-- Top bar -->
  <header class="top-bar">
    <div class="logo">
      <span class="logo-icon">♫</span>
      <span class="logo-text">Maestro IDE</span>
    </div>
    <div class="top-bar-right">
      <span class="connection-status" class:connected class:disconnected={!connected}>
        {connected ? '●' : '○'} {connected ? 'Connected' : 'Disconnected'}
      </span>
      <button class="mode-toggle" onclick={toggleMode}>
        {mode === 'simple' ? '🧑‍💻 Simple' : '⚙️ Advanced'}
      </button>
    </div>
  </header>

  <!-- Main content area -->
  <main class="main-content">
    <!-- Left sidebar: Project status -->
    <aside class="sidebar">
      <div class="sidebar-section">
        <h3>Project Status</h3>
        <ProjectRadar />
      </div>

      <div class="sidebar-section">
        <h3>Quick Actions</h3>
        <button class="action-btn" disabled={!connected}>
          🚀 Start Workflow
        </button>
        <button class="action-btn" disabled={!connected}>
          💬 AI Dialog
        </button>
        <button class="action-btn" disabled={!connected}>
          📺 Terminal
        </button>
      </div>
    </aside>

    <!-- Right content area -->
    <section class="content-area">
      <WorkflowCommander />
    </section>
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background: #1e1e2e;
    color: #cdd6f4;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background: #181825;
    border-bottom: 1px solid #313244;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .logo-icon {
    font-size: 20px;
  }

  .logo-text {
    font-size: 16px;
    font-weight: 600;
    color: #cba6f7;
  }

  .top-bar-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .connection-status {
    font-size: 12px;
    &.connected { color: #a6e3a1; }
    &.disconnected { color: #f38ba8; }
  }

  .mode-toggle {
    padding: 4px 12px;
    border: 1px solid #45475a;
    border-radius: 4px;
    background: #313244;
    color: #cdd6f4;
    cursor: pointer;
    font-size: 13px;
    &:hover { background: #45475a; }
  }

  .main-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .sidebar {
    width: 260px;
    background: #181825;
    border-right: 1px solid #313244;
    padding: 16px;
    overflow-y: auto;
  }

  .sidebar-section {
    margin-bottom: 24px;
  }

  .sidebar-section h3 {
    font-size: 12px;
    text-transform: uppercase;
    color: #6c7086;
    margin-bottom: 12px;
  }

  .action-btn {
    display: block;
    width: 100%;
    padding: 10px;
    margin-bottom: 8px;
    border: 1px solid #45475a;
    border-radius: 6px;
    background: #313244;
    color: #cdd6f4;
    cursor: pointer;
    font-size: 14px;
    text-align: left;
    &:hover:not(:disabled) { background: #45475a; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  .content-area {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
</style>
