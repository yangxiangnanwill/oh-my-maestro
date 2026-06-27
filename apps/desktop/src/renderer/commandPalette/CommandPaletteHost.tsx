import { type ReactNode, useEffect } from "react";
import { useHotkey } from "renderer/hotkeys";
import { CommandContextProvider } from "./core/ContextProvider";
import { useFrameStackStore } from "./core/frames";
import { registerAllModules } from "./modules";

export function CommandPaletteHost({ children }: { children?: ReactNode }) {
	useEffect(() => {
		const unregister = registerAllModules();
		return unregister;
	}, []);

	return (
		<CommandContextProvider>
			<CommandPaletteTrigger />
			{children}
		</CommandContextProvider>
	);
}

function CommandPaletteTrigger() {
	const setOpen = useFrameStackStore((s) => s.setOpen);
	useHotkey("OPEN_COMMAND_PALETTE", () => setOpen(true));
	return null;
}
