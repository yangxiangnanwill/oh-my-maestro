// Stub: renderer/stores/add-repository-modal
// Provides hooks for opening the "add repository" / "new project" modal.

let isOpen = false;
let openCallback: (() => void) | null = null;

export function useOpenNewProjectModal(): () => void {
  return () => {
    isOpen = true;
    openCallback?.();
  };
}
