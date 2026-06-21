<script lang="ts">
  import { Terminal } from '@xterm/xterm';
  import { FitAddon } from '@xterm/addon-fit';
  import { wsClient, displayMode, terminalSessions } from '$lib/client/stores/index.js';
  import type { TerminalSession } from '$lib/shared/types.js';
  import { Channels, TerminalEvents } from '$lib/shared/events.js';
  import type { DisplayMode } from '$lib/shared/types.js';

  // xterm.js CSS
  import '@xterm/xterm/css/xterm.css';

  /** Maximum concurrent terminal sessions */
  const MAX_SESSIONS = 5;

  // Component state
  let terminals = $state<TerminalSession[]>([]);
  let activeTerminalId = $state<string | null>(null);
  let containerEl = $state<HTMLDivElement | null>(null);

  // Map of active xterm.js instances: terminalId → { terminal, fitAddon }
  const xtermInstances = new Map<string, { terminal: Terminal; fitAddon: FitAddon }>();

  // Catppuccin Mocha theme for xterm.js
  const MOCHA_THEME = {
    background: '#1e1e2e',
    foreground: '#cdd6f4',
    cursor: '#f5e0dc',
    cursorAccent: '#1e1e2e',
    selectionBackground: '#585b70',
    selectionForeground: '#cdd6f4',
    black: '#45475a',
    red: '#f38ba8',
    green: '#a6e3a1',
    yellow: '#f9e2af',
    blue: '#89b4fa',
    magenta: '#cba6f7',
    cyan: '#94e2d5',
    white: '#bac2de',
    brightBlack: '#585b70',
    brightRed: '#f38ba8',
    brightGreen: '#a6e3a1',
    brightYellow: '#f9e2af',
    brightBlue: '#89b4fa',
    brightMagenta: '#cba6f7',
    brightCyan: '#94e2d5',
    brightWhite: '#a6adc8',
  };

  /**
   * Create a new xterm.js Terminal instance with Catppuccin Mocha theme
   * and FitAddon for responsive sizing.
   */
  function createXtermInstance(terminalId: string): { terminal: Terminal; fitAddon: FitAddon } | null {
    const existing = xtermInstances.get(terminalId);
    if (existing) return existing;

    const terminal = new Terminal({
      theme: MOCHA_THEME,
      fontSize: 13,
      fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace",
      cursorBlink: true,
      cursorStyle: 'bar',
      allowProposedApi: true,
      scrollback: 1000,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    // Forward user keyboard input to server via WebSocket
    terminal.onData((data) => {
      wsClient.send({
        channel: Channels.TERMINAL,
        type: TerminalEvents.INPUT,
        payload: { terminalId, data },
        timestamp: new Date().toISOString(),
      });
    });

    // Ctrl+C shortcut: send ETX (0x03) to PTY
    terminal.attachCustomKeyEventHandler((e) => {
      if (e.ctrlKey && e.key === 'c' && terminal.hasSelection() === false) {
        wsClient.send({
          channel: Channels.TERMINAL,
          type: TerminalEvents.INPUT,
          payload: { terminalId, data: '\x03' },
          timestamp: new Date().toISOString(),
        });
        return false;
      }
      return true;
    });

    xtermInstances.set(terminalId, { terminal, fitAddon });
    return { terminal, fitAddon };
  }

  /**
   * Mount a terminal to its DOM container and fit it.
   */
  function mountTerminal(terminalId: string, element: HTMLElement): void {
    const instance = xtermInstances.get(terminalId);
    if (!instance) return;

    instance.terminal.open(element);
    // Fit after a microtask to let DOM settle
    queueMicrotask(() => instance.fitAddon.fit());
  }

  /**
   * Send a request to create a new terminal session on the server.
   */
  function createNewTerminal(): void {
    if (terminals.length >= MAX_SESSIONS) return;

    wsClient.send({
      channel: Channels.TERMINAL,
      type: TerminalEvents.CREATE,
      payload: {},
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Destroy a terminal session.
   */
  function destroyTerminal(terminalId: string): void {
    const instance = xtermInstances.get(terminalId);
    if (instance) {
      instance.terminal.dispose();
      xtermInstances.delete(terminalId);
    }

    wsClient.send({
      channel: Channels.TERMINAL,
      type: TerminalEvents.DESTROY,
      payload: { terminalId },
      timestamp: new Date().toISOString(),
    });

    // Switch to another tab if destroying the active one
    if (activeTerminalId === terminalId) {
      const remaining = terminals.filter((t) => t.terminalId !== terminalId);
      activeTerminalId = remaining.length > 0 ? remaining[0].terminalId : null;
    }

    terminals = terminals.filter((t) => t.terminalId !== terminalId);
  }

  /**
   * Switch active terminal tab.
   */
  function switchTab(terminalId: string): void {
    if (activeTerminalId === terminalId) return;
    activeTerminalId = terminalId;

    // Re-fit the selected terminal after tab switch
    // Schedule after DOM update
    queueMicrotask(() => {
      const instance = xtermInstances.get(terminalId);
      if (instance) {
        instance.fitAddon.fit();
      }
    });
  }

  /**
   * Fit all active xterm.js instances — called on ResizeObserver trigger.
   */
  function fitAllTerminals(): void {
    for (const [, instance] of xtermInstances) {
      try {
        instance.fitAddon.fit();
      } catch {
        // Fit may fail if terminal element is not visible — safe to ignore
      }
    }
  }

  /**
   * Handle term:output events — write ANSI data to xterm instance.
   */
  function handleTermOutput(terminalId: string, data: string): void {
    const instance = xtermInstances.get(terminalId);
    if (instance) {
      instance.terminal.write(data);
    }
  }

  // ── $effect: subscribe to TERMINAL channel events ──
  $effect(() => {
    const unsubTerminal = wsClient.on(Channels.TERMINAL, (message) => {
      switch (message.type) {
        case TerminalEvents.CREATED: {
          const payload = message.payload as { terminalId: string; session: TerminalSession };
          const { terminalId, session } = payload;

          // Create xterm instance
          createXtermInstance(terminalId);

          // Add to terminals list
          terminals = [...terminals, session];

          // Auto-select if first terminal
          if (!activeTerminalId) {
            activeTerminalId = terminalId;
          }
          break;
        }

        case TerminalEvents.OUTPUT: {
          const payload = message.payload as { terminalId: string; data: string };
          handleTermOutput(payload.terminalId, payload.data);
          break;
        }

        case TerminalEvents.EXIT: {
          const payload = message.payload as { terminalId: string; exitCode: number | null };
          const instance = xtermInstances.get(payload.terminalId);
          if (instance) {
            instance.terminal.writeln(`\r\n\x1b[33m[Process exited with code ${payload.exitCode ?? 'null'}]\x1b[0m`);
          }
          // Update session status
          terminals = terminals.map((t) =>
            t.terminalId === payload.terminalId ? { ...t, status: 'exited' } : t,
          );
          break;
        }

        case TerminalEvents.RESIZE: {
          // Server acknowledged resize — no action needed on client
          break;
        }
      }
    });

    // Sync terminal sessions from store
    const unsubStore = terminalSessions.subscribe((sessions) => {
      // Only update if the terminal doesn't already exist locally
      // This prevents store updates from overwriting local state driven by events
    });

    return () => {
      unsubTerminal();
      unsubStore();
    };
  });

  // ── ResizeObserver for container ──
  $effect(() => {
    const el = containerEl;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      fitAllTerminals();

      // Send resize for active terminal
      if (activeTerminalId) {
        const instance = xtermInstances.get(activeTerminalId);
        if (instance) {
          const dims = instance.fitAddon.proposeDimensions();
          if (dims) {
            wsClient.send({
              channel: Channels.TERMINAL,
              type: TerminalEvents.RESIZE,
              payload: {
                terminalId: activeTerminalId,
                cols: dims.cols,
                rows: dims.rows,
              },
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  });

  // ── Computed: active terminal session ──
  let activeSession = $derived(
    activeTerminalId ? terminals.find((t) => t.terminalId === activeTerminalId) : undefined,
  );

  // ── Computed: can create more sessions ──
  let canCreate = $derived(terminals.length < MAX_SESSIONS);

  /**
   * Style helper for tab status dot color.
   */
  function getStatusColor(status: string): string {
    switch (status) {
      case 'running':
        return '#a6e3a1';
      case 'exited':
        return '#f38ba8';
      case 'crashed':
        return '#f38ba8';
      case 'spawning':
        return '#f9e2af';
      default:
        return '#6c7086';
    }
  }

  // ── $effect: mount active terminal to DOM ──
  $effect(() => {
    // Re-run when activeTerminalId changes or terminals list changes
    const id = activeTerminalId;
    if (!id) return;

    // Find the DOM element for the active terminal
    const el = document.querySelector(`[data-terminal-id="${id}"]`) as HTMLDivElement | null;
    if (!el) return;

    // Check if this terminal is already mounted in this element
    const instance = xtermInstances.get(id);
    if (!instance) return;

    // Only mount if not already attached to this element
    if (instance.terminal.element?.parentElement !== el) {
      mountTerminal(id, el);
    }
  });
</script>

<div class="terminal-bridge">
  <!-- Tab bar -->
  <div class="terminal-tabs">
    {#each terminals as term (term.terminalId)}
      <button
        class="terminal-tab"
        class:active={term.terminalId === activeTerminalId}
        onclick={() => switchTab(term.terminalId)}
      >
        <span class="tab-status-dot" style="background-color: {getStatusColor(term.status)}"></span>
        <span class="tab-label">{term.terminalId.slice(0, 8)}</span>
        <span
          class="tab-close"
          onclick={(e: MouseEvent) => {
            e.stopPropagation();
            destroyTerminal(term.terminalId);
          }}
          onkeydown={(e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              destroyTerminal(term.terminalId);
            }
          }}
          role="button"
          tabindex="0"
        >
          ×
        </span>
      </button>
    {/each}
    <button
      class="terminal-tab terminal-tab--create"
      disabled={!canCreate}
      onclick={createNewTerminal}
      title={canCreate ? 'New terminal' : `Maximum ${MAX_SESSIONS} terminals`}
    >
      +
    </button>
  </div>

  <!-- Terminal container -->
  <div class="terminal-container" bind:this={containerEl}>
    {#if terminals.length === 0}
      <div class="terminal-placeholder">
        <p>No terminal sessions</p>
        <button class="create-btn" onclick={createNewTerminal}>
          Create Terminal
        </button>
      </div>
    {:else}
      {#each terminals as term (term.terminalId)}
        <div
          class="terminal-instance"
          class:hidden={term.terminalId !== activeTerminalId}
          data-terminal-id={term.terminalId}
        ></div>
      {/each}

      <!-- Simple mode annotation overlay -->
      {#if $displayMode === 'simple'}
        <div class="annotation-overlay">
          <span class="annotation-text">Terminal</span>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .terminal-bridge {
    display: flex;
    flex-direction: column;
    height: 100%;
    font-size: 13px;
    color: #cdd6f4;
    background: #1e1e2e;
  }

  /* ── Tab bar ── */
  .terminal-tabs {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px 8px;
    background: #181825;
    border-bottom: 1px solid #313244;
    overflow-x: auto;
    flex-shrink: 0;
  }

  .terminal-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px 4px 8px;
    border: 1px solid transparent;
    border-radius: 4px;
    background: #313244;
    color: #a6adc8;
    cursor: pointer;
    font-size: 12px;
    font-family: monospace;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .terminal-tab:hover {
    background: #45475a;
    color: #cdd6f4;
  }

  .terminal-tab.active {
    background: #1e1e2e;
    border-color: #89b4fa;
    color: #cdd6f4;
  }

  .terminal-tab--create {
    padding: 4px 10px;
    font-size: 14px;
    font-weight: 700;
    color: #6c7086;
    min-width: 28px;
    justify-content: center;
  }

  .terminal-tab--create:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .terminal-tab--create:not(:disabled):hover {
    color: #a6e3a1;
    border-color: #a6e3a1;
  }

  .tab-status-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .tab-label {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tab-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 3px;
    font-size: 14px;
    line-height: 1;
    color: #6c7086;
    transition: background-color 0.15s ease, color 0.15s ease;
    flex-shrink: 0;
  }

  .tab-close:hover {
    background: rgba(243, 139, 168, 0.2);
    color: #f38ba8;
  }

  /* ── Terminal container ── */
  .terminal-container {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .terminal-instance {
    position: absolute;
    inset: 0;
    padding: 4px;
  }

  .terminal-instance.hidden {
    display: none;
  }

  /* ── Placeholder ── */
  .terminal-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 12px;
    color: #6c7086;
  }

  .create-btn {
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

  .create-btn:hover {
    background: rgba(137, 180, 250, 0.2);
  }

  /* ── Annotation overlay (simple mode) ── */
  .annotation-overlay {
    position: absolute;
    top: 8px;
    right: 12px;
    pointer-events: none;
    z-index: 10;
  }

  .annotation-text {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6c7086;
    background: rgba(30, 30, 46, 0.85);
    padding: 2px 8px;
    border-radius: 3px;
    border: 1px solid #313244;
  }

  /* ── Responsive ── */
  @media (max-width: 700px) {
    .terminal-tabs {
      padding: 4px 4px;
    }

    .terminal-tab {
      padding: 4px 8px;
      font-size: 11px;
    }
  }
</style>
