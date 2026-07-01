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
	addChatPane: (tabId: string, options?: { sessionId?: string }) => string;
	switchChatSession: (paneId: string, sessionId: string) => void;
	setChatLaunchConfig: (paneId: string, config: ChatLaunchConfig) => void;
}

// IDs generated via crypto.randomUUID() — no module-level mutable counters (HMR-safe).
function nextTabId(): string {
	return crypto.randomUUID();
}

function nextPaneId(): string {
	return crypto.randomUUID();
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
			// Phase 4: 将 url 存储到 pane 对象中
			panes: { ...state.panes, [id]: { id, type: "browser", tabId, url } },
		}));
	},

	addChatTab: (workspaceId, _options) => {
		const id = nextTabId();
		set((state) => ({
			tabs: [...state.tabs, { id, workspaceId }],
		}));
		return id;
	},

	addChatPane: (tabId, _options) => {
		const id = nextPaneId();
		set((state) => ({
			panes: { ...state.panes, [id]: { id, type: "chat", tabId } },
		}));
		return id;
	},

	switchChatSession: (_paneId, _sessionId) => {
		// Stub: session switching handled by chat adapter
	},

	setChatLaunchConfig: (_paneId, _config) => {
		// Stub: launch config stored externally by chat adapter
	},
}));
