# Task: TASK-010 - Create Basic Utility Classes

## Implementation Summary

Successfully migrated 5 brand-agnostic utility modules from Superset source to Maestro codebase. All files copied without modification as they contain no Superset-specific references.

### Files Created

#### Directories
- **`apps/desktop/src/main/lib/safe-url/`** (4 files):
  - `index.ts` - Barrel export for safe-url utilities
  - `safe-url.ts` - Wraps `shell.openExternal` with URL scheme allowlist
  - `scheme.ts` - URL validation logic (http(s)/mailto only)
  - `safe-url.test.ts` - Test suite for safe-url functionality

- **`apps/desktop/src/main/lib/sanitize/`** (3 files):
  - `index.ts` - Barrel export for sanitize utilities
  - `sanitize.ts` - Binary name validation for shell safety
  - `sanitize.test.ts` - Test suite for sanitization

#### Individual Files
- **`apps/desktop/src/main/lib/tree-kill.ts`** (3.3 KB)
  - `treeKillAsync()` - Promise-based process tree termination
  - `treeKillWithEscalation()` - Escalates from SIGTERM to SIGKILL with polling
  - Helper functions: `isProcessAlive()`, `isProcessNotFoundError()`

- **`apps/desktop/src/main/lib/data-batcher.ts`** (2.7 KB)
  - `DataBatcher` class - Batches terminal data to reduce IPC overhead
  - Time-based batching (16ms = 60fps) and size-based (200KB max)
  - Proper UTF-8 handling via `StringDecoder` for multi-byte sequences

- **`apps/desktop/src/main/lib/keyboardLayout.ts`** (3.0 KB)
  - `getKeyboardLayoutSnapshot()` - Current keyboard layout snapshot
  - `onKeyboardLayoutChange()` - Subscribe to layout change events
  - Lazy-loads native-keymap on first access
  - Returns: `layoutId`, `layoutName`, `unshifted` keymap

## Convergence Verification

✓ Criterion 1: `safe-url/` contains 4 files (expected ~3)
✓ Criterion 2: `sanitize/` contains 3 files (expected ~2)
✓ Criterion 3: `tree-kill.ts` exists
✓ Criterion 4: `data-batcher.ts` exists
✓ Criterion 5: `keyboardLayout.ts` exists
✓ Criterion 6: No Superset brand references found

## Technical Details

### Dependencies Used
- **Standard Node.js**: `node:events`, `node:string_decoder`
- **Electron**: `shell` from electron package
- **Third-party**: `tree-kill`, `shell-quote`, `native-keymap`

### Key Features
1. **URL Safety**: `safeOpenExternal()` validates URLs against allowlist before opening
2. **Process Management**: Hierarchical process termination with escalation
3. **Terminal Performance**: `DataBatcher` reduces IPC message count while maintaining 60fps updates
4. **Keyboard Support**: Platform-specific keyboard layout detection (macOS native notification support)
5. **Shell Safety**: `isValidBinaryName()` validates binary names for shell injection safety

### Integration Points
- **Safe URL**: Used by any code needing to open external links safely
- **Data Batcher**: Terminal data stream batching for renderer IPC
- **Tree Kill**: Process cleanup during app shutdown or error handling
- **Keyboard Layout**: Renderer can detect layout changes for keybinding display
- **Sanitize**: Command/script execution validation

## Status: ✅ Complete

All Wave 1 (TASK-010) utilities successfully migrated. Ready for Wave 2 tasks (TASK-011, TASK-012).
