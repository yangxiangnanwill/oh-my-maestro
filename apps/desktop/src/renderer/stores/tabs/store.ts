// Phase 4: Tabs store (migrated from Superset)
// zustand store managing tab and pane state for the workspace view.

import { create } from "zustand";

export interface Tab {
  id: string;
  workspaceId: string;
  autoTitle?: string;
}

export interface Pane {
  id: string;
  type: string;
  tabId: string;
  fileViewer?: {
    filePath?: string;
    diffCategory?: string;
    commitHash?: string;
    oldPath?: string;
    viewMode?: string;
  };
}

interface ChatLaunchConfig {
  thinkingLevel?: string;
}

interface TabsState {
  tabs: Tab[];
  panes: Record<string, Pane | undefined>;
  addTab: (workspaceId: string) => string;
  setTabAutoTitle: (tabId: string, title: string) => void;
  addPane: (tabId: string) => string;
  removePane: (paneId: string) => void;
  addFileViewerPane: (
    workspaceId: string,
    options: {
      filePath: string;
      diffCategory?: string;
      commitHash?: string;
      oldPath?: string;
      viewMode?: string;
    },
  ) => void;
  openInBrowserPane: (workspaceId: string, url: string) => void;
  addChatTab: (workspaceId: string, options?: { sessionId?: string }) => string;
  addChatPane: (
    tabId: string,
    options?: { sessionId?: string },
  ) => string;
  switchChatSession: (paneId: string, sessionId: string) => void;
  setChatLaunchConfig: (paneId: string, config: ChatLaunchConfig) => void;
}

let tabCounter = 0;
let paneCounter = 0;

function nextTabId(): string {
  return `tab-${++tabCounter}-${Date.now()}`;
}

function nextPaneId(): string {
  return `pane-${++paneCounter}-${Date.now()}`;
}

export const useTabsStore = create<TabsState>((set, get) => ({
  tabs: [],
  panes: {},

  addTab: (workspaceId) => {
    const id = nextTabId();
    set((state) => ({
      tabs: [...state.tabs, { id, workspaceId }],
    }));
    return id;
  },

  setTabAutoTitle: (tabId, title) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId ? { ...t, autoTitle: title } : t,
      ),
    })),

  addPane: (tabId) => {
    const id = nextPaneId();
    set((state) => ({
      panes: { ...state.panes, [id]: { id, type: "terminal", tabId } },
    }));
    return id;
  },

  removePane: (paneId) =>
    set((state) => {
      const next = { ...state.panes };
      delete next[paneId];
      return { panes: next };
    }),

  addFileViewerPane: (workspaceId, options) => {
    const tab = get().tabs.find((t) => t.workspaceId === workspaceId);
    const tabId = tab?.id ?? get().addTab(workspaceId);
    const id = nextPaneId();
    set((state) => ({
      panes: {
        ...state.panes,
        [id]: {
          id,
          type: "file-viewer",
          tabId,
          fileViewer: {
            filePath: options.filePath,
            diffCategory: options.diffCategory,
            commitHash: options.commitHash,
            oldPath: options.oldPath,
            viewMode: options.viewMode ?? "view",
          },
        },
      },
    }));
  },

  openInBrowserPane: (workspaceId, url) => {
    const tab = get().tabs.find((t) => t.workspaceId === workspaceId);
    const tabId = tab?.id ?? get().addTab(workspaceId);
    const id = nextPaneId();
    set((state) => ({
      panes: { ...state.panes, [id]: { id, type: "browser", tabId } },
    }));
  },

  addChatTab: (workspaceId, options) => {
    const id = nextTabId();
    set((state) => ({
      tabs: [...state.tabs, { id, workspaceId }],
    }));
    return id;
  },

  addChatPane: (tabId, options) => {
    const id = nextPaneId();
    set((state) => ({
      panes: { ...state.panes, [id]: { id, type: "chat", tabId } },
    }));
    return id;
  },

  switchChatSession: (paneId, sessionId) => {
    // Stub: session switching handled by chat adapter
  },

  setChatLaunchConfig: (paneId, config) => {
    // Stub: launch config stored externally by chat adapter
  },
}));
