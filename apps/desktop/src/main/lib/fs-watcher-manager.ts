// Stub: WatchPathEventBatch type
// Full implementation will be added in a later phase.

export type WatchPathEventBatch = {
	events: Array<{
		kind: string;
		absolutePath: string;
		oldAbsolutePath?: string;
	}>;
};
