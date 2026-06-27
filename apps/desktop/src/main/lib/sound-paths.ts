// Phase 4: Sound file paths (migrated from Superset main/lib/sound-paths)

import { join } from "node:path";
import { app } from "electron";

export function getSoundPath(filename: string): string | null {
	const isPackaged = typeof app?.isPackaged === "boolean" && app.isPackaged;
	if (isPackaged) {
		return join(process.resourcesPath, "assets", "sounds", filename);
	}
	return join(app.getAppPath(), "src", "resources", "assets", "sounds", filename);
}
