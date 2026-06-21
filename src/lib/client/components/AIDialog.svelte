<script lang="ts">
  import { wsClient, displayMode, dialogSessions, dialogMessages, dialogIntents } from '$lib/client/stores/index.js';
  import type { DialogSession, DialogMessage, DialogIntentState, StreamChunk, IntentCandidate } from '$lib/shared/types.js';
  import { Channels, DialogEvents } from '$lib/shared/events.js';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  import hljs from 'highlight.js/lib/core';
  import javascript from 'highlight.js/lib/languages/javascript';
  import typescript from 'highlight.js/lib/languages/typescript';
  import bash from 'highlight.js/lib/languages/bash';
  import json from 'highlight.js/lib/languages/json';

  // 注册 highlight.js 语言
  hljs.registerLanguage('javascript', javascript);
  hljs.registerLanguage('js', javascript);
  hljs.registerLanguage('typescript', typescript);
  hljs.registerLanguage('ts', typescript);
  hljs.registerLanguage('bash', bash);
  hljs.registerLanguage('sh', bash);
  hljs.registerLanguage('json', json);

  // 配置 marked 使用 highlight.js
  marked.setOptions({
    highlight: (code: string, lang: string) => {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(code, { language: lang }).value;
        } catch {
          // 高亮失败时返回原始代码
        }
      }
      // 自动检测语言
      try {
        return hljs.highlightAuto(code).value;
      } catch {
        return code;
      }
    },
  });

  /** 将 Markdown 文本渲染为 HTML */
  function renderMarkdown(text: string): string {
    try {
      const raw = marked.parse(text, { async: false }) as string;
      return DOMPurify.sanitize(raw);
    } catch {
      return DOMPurify.sanitize(text);
    }
  }

  // ── 组件状态 ──
  let inputText = $state('');
  let activeSessionId = $state<string | null>(null);
  let sessions = $state<DialogSession[]>([]);
  let messages = $state<DialogMessage[]>([]);
  let intents = $state<DialogIntentState[]>([]);
  let isCreating = $state(false);
  let isSending = $state(false);
  let error = $state<string | null>(null);
  let messagesContainer = $state<HTMLDivElement | null>(null);

  /** 当前会话的消息 */
  let activeMessages = $derived(
    activeSessionId ? messages.filter((m) => m.sessionId === activeSessionId) : [],
  );

  /** 当前会话的意图路由结果 */
  let activeIntent = $derived(
    activeSessionId ? intents.find((i) => i.sessionId === activeSessionId) : undefined,
  );

  /** 当前会话信息 */
  let activeSession = $derived(
    activeSessionId ? sessions.find((s) => s.sessionId === activeSessionId) : undefined,
  );

  // ── $effect: 同步 stores 到组件本地状态 ──
  $effect(() => {
    const unsubSessions = dialogSessions.subscribe((s) => {
      sessions = s;
    });
    const unsubMessages = dialogMessages.subscribe((m) => {
      messages = m;
    });
    const unsubIntents = dialogIntents.subscribe((i) => {
      intents = i;
    });

    return () => {
      unsubSessions();
      unsubMessages();
      unsubIntents();
    };
  });

  // ── $effect: 新消息到达时自动滚动到底部 ──
  $effect(() => {
    // 依赖 activeMessages 的长度变化触发
    const count = activeMessages.length;
    if (count > 0 && messagesContainer) {
      queueMicrotask(() => {
        messagesContainer?.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });
      });
    }
  });

  /** 创建新的对话会话 */
  function createSession(): void {
    isCreating = true;
    error = null;

    fetch('/api/dialog/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
      .then((r) => r.json())
      .then((data: { session: DialogSession }) => {
        activeSessionId = data.session.sessionId;
        isCreating = false;
      })
      .catch((e: Error) => {
        error = e.message;
        isCreating = false;
      });
  }

  /** 发送消息到当前会话 */
  function sendMessage(): void {
    const text = inputText.trim();
    if (!text || !activeSessionId) return;

    isSending = true;
    error = null;

    // 立即添加用户消息到本地列表
    const userMsg: DialogMessage = {
      sessionId: activeSessionId,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    dialogMessages.update((msgs) => [...msgs, userMsg]);

    const sentText = text;
    inputText = '';

    fetch(`/api/dialog/sessions/${activeSessionId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: sentText }),
    })
      .then((r) => r.json())
      .then(() => {
        isSending = false;
      })
      .catch((e: Error) => {
        error = e.message;
        isSending = false;
      });
  }

  /** 关闭当前会话 */
  function closeSession(): void {
    if (!activeSessionId) return;

    fetch(`/api/dialog/sessions/${activeSessionId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(() => {
        activeSessionId = null;
      })
      .catch((e: Error) => {
        error = e.message;
      });
  }

  /** 处理回车发送（Shift+Enter 换行） */
  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  /** 获取意图路由的置信度颜色 */
  function getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return '#a6e3a1';
    if (confidence >= 0.5) return '#f9e2af';
    return '#6c7086';
  }

  /** 点击候选工作流 */
  function selectCandidate(workflowId: string): void {
    // 可以在此处触发工作流执行
    fetch('/api/workflows/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflowId, params: {} }),
    }).catch((e: Error) => {
      error = e.message;
    });
  }

  /** 格式化时间戳 */
  function formatTime(ts: string): string {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }
</script>

<div class="ai-dialog">
  <!-- 会话列表 / 新建会话 -->
  <div class="dialog-sidebar">
    <button
      class="new-chat-btn"
      onclick={createSession}
      disabled={isCreating}
    >
      {isCreating ? 'Creating...' : '+ New Chat'}
    </button>

    <div class="session-list">
      {#each sessions as session (session.sessionId)}
        <button
          class="session-item"
          class:active={session.sessionId === activeSessionId}
          class:closed={session.status === 'closed'}
          onclick={() => activeSessionId = session.sessionId}
        >
          <span class="session-id">{session.sessionId.slice(0, 12)}...</span>
          <span class="session-status" class:status-active={session.status === 'active'} class:status-closed={session.status === 'closed'}>
            {session.status}
          </span>
        </button>
      {/each}
    </div>
  </div>

  <!-- 主对话区域 -->
  <div class="dialog-main">
    {#if !activeSessionId}
      <div class="dialog-placeholder">
        <div class="placeholder-icon">💬</div>
        <h2>AI Dialog</h2>
        <p>Create a new chat session to start interacting with Claude Code CLI.</p>
        <button class="start-btn" onclick={createSession} disabled={isCreating}>
          {isCreating ? 'Creating...' : 'Start Chat'}
        </button>
      </div>
    {:else}
      <!-- 会话头部 -->
      <div class="dialog-header">
        <span class="header-session-id">{activeSessionId}</span>
        <span class="header-status" class:status-active={activeSession?.status === 'active'} class:status-closed={activeSession?.status === 'closed'}>
          {activeSession?.status ?? 'unknown'}
        </span>
        <button
          class="close-btn"
          onclick={closeSession}
          disabled={activeSession?.status === 'closed'}
        >
          Close
        </button>
      </div>

      <!-- 消息列表 -->
      <div class="messages-container" bind:this={messagesContainer}>
        {#if activeMessages.length === 0}
          <div class="messages-empty">
            <p>Send a message to start the conversation.</p>
          </div>
        {:else}
          {#each activeMessages as msg (msg.timestamp + msg.content.slice(0, 20))}
            <div class="message-row" class:msg-user={msg.role === 'user'} class:msg-assistant={msg.role === 'assistant'}>
              <div class="message-avatar">
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <div class="message-body">
                <div class="message-meta">
                  <span class="message-role">{msg.role === 'user' ? 'You' : 'Claude'}</span>
                  <span class="message-time">{formatTime(msg.timestamp)}</span>
                  {#if msg.type && msg.type !== 'text'}
                    <span class="message-type-badge">{msg.type}</span>
                  {/if}
                </div>
                <div class="message-content">
                  {#if msg.role === 'user'}
                    <p class="user-text">{msg.content}</p>
                  {:else}
                    <!-- assistant 消息使用 Markdown 渲染 -->
                    {@html renderMarkdown(msg.content)}
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        {/if}

        <!-- 发送中指示器 -->
        {#if isSending}
          <div class="message-row msg-assistant">
            <div class="message-avatar">🤖</div>
            <div class="message-body">
              <div class="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- 意图路由结果显示 -->
      {#if activeIntent}
        <div class="intent-bar">
          {#if activeIntent.intent.confidence >= 0.8}
            <div class="intent-direct">
              <span class="intent-icon">🎯</span>
              <span class="intent-label">Routed to:</span>
              <span class="intent-workflow">{activeIntent.intent.workflowId}</span>
              <span class="intent-confidence" style="color: {getConfidenceColor(activeIntent.intent.confidence)}">
                {Math.round(activeIntent.intent.confidence * 100)}%
              </span>
            </div>
          {:else if activeIntent.intent.confidence >= 0.5}
            <div class="intent-disambiguate">
              <span class="intent-icon">🔍</span>
              <span class="intent-label">Did you mean:</span>
              <div class="candidate-list">
                {#each activeIntent.intent.candidates as candidate (candidate.workflowId)}
                  <button
                    class="candidate-btn"
                    onclick={() => selectCandidate(candidate.workflowId)}
                  >
                    <span class="candidate-name">{candidate.workflowId}</span>
                    <span class="candidate-score" style="color: {getConfidenceColor(candidate.score)}">
                      {Math.round(candidate.score * 100)}%
                    </span>
                  </button>
                {/each}
              </div>
            </div>
          {:else}
            <div class="intent-none">
              <span class="intent-icon">💭</span>
              <span class="intent-label">No specific workflow detected</span>
            </div>
          {/if}
        </div>
      {/if}

      <!-- 输入区域 -->
      <div class="input-area">
        <textarea
          class="message-input"
          bind:value={inputText}
          onkeydown={handleKeydown}
          placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
          rows="2"
          disabled={isSending || activeSession?.status === 'closed'}
        ></textarea>
        <button
          class="send-btn"
          onclick={sendMessage}
          disabled={isSending || !inputText.trim() || activeSession?.status === 'closed'}
        >
          {isSending ? '...' : 'Send'}
        </button>
      </div>
    {/if}

    <!-- 错误提示 -->
    {#if error}
      <div class="error-toast">
        <span class="error-text">{error}</span>
        <button class="error-dismiss" onclick={() => error = null}>×</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .ai-dialog {
    display: flex;
    height: 100%;
    font-size: 13px;
    color: #cdd6f4;
    background: #1e1e2e;
  }

  /* ── 侧边栏 ── */
  .dialog-sidebar {
    width: 200px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #313244;
    background: #181825;
    padding: 12px;
    gap: 10px;
  }

  .new-chat-btn {
    padding: 8px 12px;
    border: 1px solid #89b4fa;
    border-radius: 6px;
    background: rgba(137, 180, 250, 0.1);
    color: #89b4fa;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: background-color 0.15s ease;
  }

  .new-chat-btn:hover:not(:disabled) {
    background: rgba(137, 180, 250, 0.2);
  }

  .new-chat-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .session-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow-y: auto;
    flex: 1;
  }

  .session-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: #313244;
    color: #a6adc8;
    cursor: pointer;
    font-size: 12px;
    font-family: monospace;
    transition: background-color 0.15s ease, border-color 0.15s ease;
    text-align: left;
  }

  .session-item:hover {
    background: #45475a;
    color: #cdd6f4;
  }

  .session-item.active {
    border-color: #89b4fa;
    background: rgba(137, 180, 250, 0.08);
    color: #cdd6f4;
  }

  .session-item.closed {
    opacity: 0.5;
  }

  .session-id {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .session-status {
    font-size: 10px;
    text-transform: uppercase;
    padding: 1px 6px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .status-active {
    background: rgba(166, 227, 161, 0.15);
    color: #a6e3a1;
  }

  .status-closed {
    background: rgba(108, 112, 134, 0.15);
    color: #6c7086;
  }

  /* ── 主区域 ── */
  .dialog-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }

  /* ── 占位状态 ── */
  .dialog-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 12px;
    color: #6c7086;
  }

  .placeholder-icon {
    font-size: 48px;
    margin-bottom: 8px;
  }

  .dialog-placeholder h2 {
    font-size: 18px;
    font-weight: 600;
    color: #cdd6f4;
    margin: 0;
  }

  .dialog-placeholder p {
    font-size: 13px;
    margin: 0;
    max-width: 300px;
    text-align: center;
    line-height: 1.5;
  }

  .start-btn {
    margin-top: 8px;
    padding: 8px 20px;
    border: 1px solid #a6e3a1;
    border-radius: 6px;
    background: rgba(166, 227, 161, 0.1);
    color: #a6e3a1;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.15s ease;
  }

  .start-btn:hover:not(:disabled) {
    background: rgba(166, 227, 161, 0.2);
  }

  .start-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ── 会话头部 ── */
  .dialog-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 14px;
    background: #181825;
    border-bottom: 1px solid #313244;
    flex-shrink: 0;
  }

  .header-session-id {
    font-family: monospace;
    font-size: 12px;
    color: #cdd6f4;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .header-status {
    font-size: 10px;
    text-transform: uppercase;
    padding: 2px 8px;
    border-radius: 3px;
  }

  .close-btn {
    padding: 4px 12px;
    border: 1px solid #f38ba8;
    border-radius: 4px;
    background: transparent;
    color: #f38ba8;
    cursor: pointer;
    font-size: 12px;
    transition: background-color 0.15s ease;
  }

  .close-btn:hover:not(:disabled) {
    background: rgba(243, 139, 168, 0.15);
  }

  .close-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* ── 消息容器 ── */
  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .messages-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #6c7086;
    font-size: 13px;
  }

  /* ── 消息行 ── */
  .message-row {
    display: flex;
    gap: 10px;
    max-width: 85%;
  }

  .message-row.msg-user {
    align-self: flex-end;
    flex-direction: row-reverse;
  }

  .message-row.msg-assistant {
    align-self: flex-start;
  }

  .message-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #313244;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
  }

  .message-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .message-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
  }

  .msg-user .message-meta {
    flex-direction: row-reverse;
  }

  .message-role {
    color: #89b4fa;
    font-weight: 600;
  }

  .msg-user .message-role {
    color: #cba6f7;
  }

  .message-time {
    color: #6c7086;
  }

  .message-type-badge {
    padding: 1px 6px;
    border-radius: 3px;
    background: rgba(249, 226, 175, 0.15);
    color: #f9e2af;
    font-size: 10px;
    text-transform: uppercase;
  }

  .message-content {
    padding: 10px 14px;
    border-radius: 12px;
    font-size: 13px;
    line-height: 1.6;
    word-break: break-word;
  }

  .msg-user .message-content {
    background: rgba(203, 166, 247, 0.12);
    border: 1px solid rgba(203, 166, 247, 0.2);
    border-bottom-right-radius: 4px;
  }

  .msg-assistant .message-content {
    background: #313244;
    border: 1px solid #45475a;
    border-bottom-left-radius: 4px;
  }

  .user-text {
    margin: 0;
    white-space: pre-wrap;
  }

  /* ── Markdown 渲染样式 ── */
  .message-content :global(p) {
    margin: 0 0 8px 0;
  }

  .message-content :global(p:last-child) {
    margin-bottom: 0;
  }

  .message-content :global(code) {
    font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace;
    font-size: 12px;
    background: #181825;
    padding: 2px 6px;
    border-radius: 3px;
    color: #f9e2af;
  }

  .message-content :global(pre) {
    background: #181825;
    border: 1px solid #313244;
    border-radius: 6px;
    padding: 12px;
    margin: 8px 0;
    overflow-x: auto;
    font-size: 12px;
    line-height: 1.5;
  }

  .message-content :global(pre code) {
    background: none;
    padding: 0;
    color: #cdd6f4;
  }

  .message-content :global(ul),
  .message-content :global(ol) {
    margin: 4px 0;
    padding-left: 20px;
  }

  .message-content :global(li) {
    margin: 2px 0;
  }

  .message-content :global(blockquote) {
    border-left: 3px solid #89b4fa;
    margin: 8px 0;
    padding: 4px 12px;
    color: #a6adc8;
    background: rgba(137, 180, 250, 0.05);
    border-radius: 0 4px 4px 0;
  }

  .message-content :global(a) {
    color: #89b4fa;
    text-decoration: underline;
  }

  .message-content :global(strong) {
    color: #f5c2e7;
  }

  .message-content :global(em) {
    color: #f5e0dc;
  }

  .message-content :global(table) {
    border-collapse: collapse;
    margin: 8px 0;
    font-size: 12px;
  }

  .message-content :global(th),
  .message-content :global(td) {
    border: 1px solid #45475a;
    padding: 6px 10px;
    text-align: left;
  }

  .message-content :global(th) {
    background: #313244;
    font-weight: 600;
  }

  /* ── 打字指示器 ── */
  .typing-indicator {
    display: flex;
    gap: 4px;
    padding: 10px 14px;
    background: #313244;
    border: 1px solid #45475a;
    border-radius: 12px;
    border-bottom-left-radius: 4px;
  }

  .typing-indicator span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #6c7086;
    animation: typing-bounce 1.4s ease-in-out infinite;
  }

  .typing-indicator span:nth-child(2) {
    animation-delay: 0.2s;
  }

  .typing-indicator span:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes typing-bounce {
    0%, 60%, 100% {
      transform: translateY(0);
      opacity: 0.4;
    }
    30% {
      transform: translateY(-4px);
      opacity: 1;
    }
  }

  /* ── 意图路由栏 ── */
  .intent-bar {
    padding: 8px 14px;
    background: #181825;
    border-top: 1px solid #313244;
    flex-shrink: 0;
  }

  .intent-direct,
  .intent-disambiguate,
  .intent-none {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .intent-icon {
    font-size: 14px;
    flex-shrink: 0;
  }

  .intent-label {
    font-size: 12px;
    color: #a6adc8;
  }

  .intent-workflow {
    font-family: monospace;
    font-size: 12px;
    color: #89b4fa;
    font-weight: 600;
  }

  .intent-confidence {
    font-size: 11px;
    font-weight: 600;
  }

  .candidate-list {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .candidate-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border: 1px solid #45475a;
    border-radius: 4px;
    background: #313244;
    color: #cdd6f4;
    cursor: pointer;
    font-size: 12px;
    font-family: monospace;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }

  .candidate-btn:hover {
    background: #45475a;
    border-color: #cba6f7;
  }

  .candidate-name {
    color: #cdd6f4;
  }

  .candidate-score {
    font-size: 11px;
    font-weight: 600;
  }

  /* ── 输入区域 ── */
  .input-area {
    display: flex;
    gap: 8px;
    padding: 12px 14px;
    background: #181825;
    border-top: 1px solid #313244;
    flex-shrink: 0;
  }

  .message-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #45475a;
    border-radius: 8px;
    background: #313244;
    color: #cdd6f4;
    font-size: 13px;
    font-family: inherit;
    resize: none;
    outline: none;
    transition: border-color 0.15s ease;
  }

  .message-input:focus {
    border-color: #89b4fa;
  }

  .message-input:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .message-input::placeholder {
    color: #6c7086;
  }

  .send-btn {
    padding: 8px 18px;
    border: 1px solid #89b4fa;
    border-radius: 8px;
    background: rgba(137, 180, 250, 0.1);
    color: #89b4fa;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: background-color 0.15s ease;
    flex-shrink: 0;
    align-self: flex-end;
  }

  .send-btn:hover:not(:disabled) {
    background: rgba(137, 180, 250, 0.2);
  }

  .send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* ── 错误提示 ── */
  .error-toast {
    position: absolute;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 16px;
    background: rgba(243, 139, 168, 0.15);
    border: 1px solid #f38ba8;
    border-radius: 8px;
    z-index: 20;
  }

  .error-text {
    font-size: 12px;
    color: #f38ba8;
  }

  .error-dismiss {
    padding: 0 4px;
    border: none;
    background: transparent;
    color: #f38ba8;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
  }

  /* ── 响应式 ── */
  @media (max-width: 700px) {
    .dialog-sidebar {
      width: 140px;
      padding: 8px;
    }

    .message-row {
      max-width: 95%;
    }
  }
</style>
