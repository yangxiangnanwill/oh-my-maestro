/**
 * Stub for LightDiffViewer component (not yet migrated from Superset).
 * Used by EditToolExpandedDiff.
 */

import type { FileContents } from "shared/changes-types";
import type { ComponentType } from "react";

export interface LightDiffViewerProps {
  contents: FileContents;
  viewMode: string;
  hideUnchangedRegions: boolean;
  filePath: string;
}

export const LightDiffViewer: ComponentType<LightDiffViewerProps> = (() => null) as unknown as ComponentType<LightDiffViewerProps>;
