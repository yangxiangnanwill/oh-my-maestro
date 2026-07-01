// Stub: renderer/stores/add-repository-modal
// Provides hooks for opening the "add repository" / "new project" modal.

let _isOpen = false;
const openCallback: (() => void) | null = null;

export function useOpenNewProjectModal(): () => void {
	return () => {
		_isOpen = true;
		openCallback?.();
	};
}
