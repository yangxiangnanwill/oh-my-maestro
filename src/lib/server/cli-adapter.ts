// Maestro IDE — CLI Adapter Layer (Versioned Registry + NDJSON Parsing)

import { exec } from 'node:child_process';
import type { WorkflowMeta, DelegateEvent } from '../shared/types.js';

/** Adapter interface for parsing CLI output by version */
export interface CLIAdapter {
  parseSkillsOutput(raw: string): WorkflowMeta[];
  parseDelegateOutput(raw: string): DelegateEvent[];
}

/** Signature matching node:child_process.exec callback style */
export type ExecFn = (
  command: string,
  callback: (error: Error | null, stdout: string, stderr: string) => void
) => unknown;

/** Thrown when no adapter is registered for the detected CLI version */
export class UnsupportedVersionError extends Error {
  readonly version: string;

  constructor(version: string) {
    super(`Unsupported CLI version: ${version}`);
    this.name = 'UnsupportedVersionError';
    this.version = version;
  }
}

/** Default adapter for CLI major version 1 */
export class DefaultCLIAdapter implements CLIAdapter {
  parseSkillsOutput(raw: string): WorkflowMeta[] {
    return raw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const parsed = JSON.parse(line);
        return {
          id: parsed.id,
          name: parsed.name,
          category: parsed.category,
          description: parsed.description,
          params: Array.isArray(parsed.params) ? parsed.params : [],
        } satisfies WorkflowMeta;
      });
  }

  parseDelegateOutput(raw: string): DelegateEvent[] {
    return raw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const parsed = JSON.parse(line);
        return {
          type: parsed.type,
          executionId: parsed.executionId,
          stepIndex: parsed.stepIndex,
          stepName: parsed.stepName,
          output: parsed.output,
          timestamp: parsed.timestamp,
        } satisfies DelegateEvent;
      });
  }
}

/**
 * CLIAdapterRegistry — versioned registry for CLI output parsers.
 * Adapters are keyed by major version string (e.g. "1").
 */
export class CLIAdapterRegistry {
  private adapters = new Map<string, CLIAdapter>();
  private execFn: ExecFn;

  constructor(execFn?: ExecFn) {
    this.execFn = execFn ?? exec;
  }

  /** Register an adapter for a given major version */
  register(version: string, adapter: CLIAdapter): void {
    this.adapters.set(version, adapter);
  }

  /**
   * Get the adapter for a given version.
   * @throws UnsupportedVersionError if no adapter is registered
   */
  getAdapter(version: string): CLIAdapter {
    const adapter = this.adapters.get(version);
    if (!adapter) {
      throw new UnsupportedVersionError(version);
    }
    return adapter;
  }

  /**
   * Detect the CLI version by running `maestro --version`.
   * Returns the major version as a string (e.g. "1").
   */
  detectVersion(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.execFn('maestro --version', (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        const raw = stdout.trim();
        // Parse semver — extract major version
        const match = raw.match(/^v?(\d+)/);
        if (!match) {
          reject(new Error(`Cannot parse version from output: "${raw}"`));
          return;
        }
        resolve(match[1]);
      });
    });
  }
}
