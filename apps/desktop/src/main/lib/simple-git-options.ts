/**
 * Stub for @superset/shared/simple-git-options (Phase 4).
 * Provides USER_GIT_ENV_SIMPLE_GIT_OPTIONS for git client configuration.
 */

import type { SimpleGitOptions } from "simple-git";

/**
 * SimpleGit options that allow inherited user Git config/env.
 * In Superset, this enables local Git client behavior by default.
 */
export const USER_GIT_ENV_SIMPLE_GIT_OPTIONS: Partial<SimpleGitOptions> = {
	config: [],
};
