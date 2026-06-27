// Phase 4: Sound file playback (migrated from Superset main/lib/play-sound)

import type { ChildProcess } from "node:child_process";

export interface PlaySoundOptions {
	onComplete?: () => void;
	isCanceled?: () => boolean;
	onProcessChange?: (proc: ChildProcess) => void;
}

export function playSoundFile(
	_soundPath: string,
	_volume?: number,
	_options?: PlaySoundOptions,
): ChildProcess | null {
	return null;
}
