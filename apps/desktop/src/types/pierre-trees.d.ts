/**
 * Type declarations for @pierre/trees.
 * Minimal stubs for the types used by the file icons and tree modules.
 */

declare module "@pierre/trees" {
  export interface FileTreeIconConfig {
    byFileName?: Record<string, string>;
    byFileExtension?: Record<string, string>;
    remap?: Record<string, string>;
  }

  export interface FileTree {
    setIcons(config: {
      set: string;
      colored: boolean;
      spriteSheet?: string;
      byFileName?: Record<string, string>;
      byFileExtension?: Record<string, string>;
      remap?: Record<string, string>;
    }): void;
  }
}
