import { describe, it, expect, beforeEach } from 'vitest';
import {
  CLIAdapterRegistry,
  DefaultCLIAdapter,
  UnsupportedVersionError,
} from '../cli-adapter.js';
import type { ExecFn } from '../cli-adapter.js';
import type { WorkflowMeta, DelegateEvent } from '../../shared/types.js';

/** Helper: create a mock exec that calls back with given result */
function mockExec(
  error: Error | null,
  stdout: string,
  stderr: string = ''
): ExecFn {
  return (_command: string, cb: (err: Error | null, out: string, se: string) => void) => {
    cb(error, stdout, stderr);
    return undefined;
  };
}

describe('CLIAdapterRegistry', () => {
  let registry: CLIAdapterRegistry;
  let adapter: DefaultCLIAdapter;

  beforeEach(() => {
    registry = new CLIAdapterRegistry();
    adapter = new DefaultCLIAdapter();
  });

  describe('register + getAdapter', () => {
    it('should register and retrieve an adapter by version', () => {
      registry.register('1', adapter);
      const result = registry.getAdapter('1');
      expect(result).toBe(adapter);
    });

    it('should allow overwriting an adapter for the same version', () => {
      const other = new DefaultCLIAdapter();
      registry.register('1', adapter);
      registry.register('1', other);
      expect(registry.getAdapter('1')).toBe(other);
    });

    it('should support multiple versions', () => {
      const v2 = new DefaultCLIAdapter();
      registry.register('1', adapter);
      registry.register('2', v2);
      expect(registry.getAdapter('1')).toBe(adapter);
      expect(registry.getAdapter('2')).toBe(v2);
    });
  });

  describe('getAdapter — UnsupportedVersionError', () => {
    it('should throw UnsupportedVersionError for unregistered version', () => {
      expect(() => registry.getAdapter('99')).toThrow(UnsupportedVersionError);
    });

    it('should include the version in the error', () => {
      try {
        registry.getAdapter('99');
      } catch (err) {
        expect(err).toBeInstanceOf(UnsupportedVersionError);
        const uve = err as UnsupportedVersionError;
        expect(uve.version).toBe('99');
        expect(uve.message).toContain('99');
      }
    });
  });

  describe('detectVersion', () => {
    it('should call maestro --version and return major version', async () => {
      const execFn = mockExec(null, '1.2.3\n');
      const reg = new CLIAdapterRegistry(execFn);

      const version = await reg.detectVersion();
      expect(version).toBe('1');
    });

    it('should handle version with leading v prefix', async () => {
      const execFn = mockExec(null, 'v2.0.0\n');
      const reg = new CLIAdapterRegistry(execFn);

      const version = await reg.detectVersion();
      expect(version).toBe('2');
    });

    it('should reject on exec error', async () => {
      const execFn = mockExec(new Error('command not found'), '');
      const reg = new CLIAdapterRegistry(execFn);

      await expect(reg.detectVersion()).rejects.toThrow('command not found');
    });

    it('should reject when version output is not parseable', async () => {
      const execFn = mockExec(null, 'not-a-version\n');
      const reg = new CLIAdapterRegistry(execFn);

      await expect(reg.detectVersion()).rejects.toThrow('Cannot parse version');
    });
  });
});

describe('DefaultCLIAdapter', () => {
  let adapter: DefaultCLIAdapter;

  beforeEach(() => {
    adapter = new DefaultCLIAdapter();
  });

  describe('parseSkillsOutput', () => {
    it('should parse NDJSON lines into WorkflowMeta[]', () => {
      const raw = [
        JSON.stringify({ id: 'wf-1', name: 'Build', category: 'dev', description: 'Build project', params: [{ name: 'target', type: 'string', required: true }] }),
        JSON.stringify({ id: 'wf-2', name: 'Test', category: 'qa', description: 'Run tests', params: [] }),
      ].join('\n');

      const result = adapter.parseSkillsOutput(raw);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual<WorkflowMeta>({
        id: 'wf-1',
        name: 'Build',
        category: 'dev',
        description: 'Build project',
        params: [{ name: 'target', type: 'string', required: true }],
      });
      expect(result[1]).toEqual<WorkflowMeta>({
        id: 'wf-2',
        name: 'Test',
        category: 'qa',
        description: 'Run tests',
        params: [],
      });
    });

    it('should default params to empty array when missing', () => {
      const raw = JSON.stringify({ id: 'wf-3', name: 'Deploy', category: 'ops', description: 'Deploy app' });
      const result = adapter.parseSkillsOutput(raw);

      expect(result).toHaveLength(1);
      expect(result[0].params).toEqual([]);
    });

    it('should skip empty lines', () => {
      const raw = '\n\n' + JSON.stringify({ id: 'wf-1', name: 'A', category: 'b', description: 'c', params: [] }) + '\n\n';
      const result = adapter.parseSkillsOutput(raw);
      expect(result).toHaveLength(1);
    });

    it('should return empty array for empty input', () => {
      expect(adapter.parseSkillsOutput('')).toEqual([]);
      expect(adapter.parseSkillsOutput('\n\n')).toEqual([]);
    });

    it('should throw on invalid JSON line', () => {
      const raw = 'not-json\n';
      expect(() => adapter.parseSkillsOutput(raw)).toThrow();
    });
  });

  describe('parseDelegateOutput', () => {
    it('should parse broker events into DelegateEvent[]', () => {
      const raw = [
        JSON.stringify({ type: 'queued', executionId: 'exec-1', timestamp: '2026-01-01T00:00:00Z' }),
        JSON.stringify({ type: 'started', executionId: 'exec-1', stepIndex: 0, stepName: 'init', timestamp: '2026-01-01T00:00:01Z' }),
        JSON.stringify({ type: 'completed', executionId: 'exec-1', stepIndex: 0, stepName: 'init', output: 'done', timestamp: '2026-01-01T00:00:02Z' }),
        JSON.stringify({ type: 'failed', executionId: 'exec-2', timestamp: '2026-01-01T00:00:03Z' }),
      ].join('\n');

      const result = adapter.parseDelegateOutput(raw);

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual<DelegateEvent>({
        type: 'queued',
        executionId: 'exec-1',
        timestamp: '2026-01-01T00:00:00Z',
      });
      expect(result[1]).toEqual<DelegateEvent>({
        type: 'started',
        executionId: 'exec-1',
        stepIndex: 0,
        stepName: 'init',
        timestamp: '2026-01-01T00:00:01Z',
      });
      expect(result[2]).toEqual<DelegateEvent>({
        type: 'completed',
        executionId: 'exec-1',
        stepIndex: 0,
        stepName: 'init',
        output: 'done',
        timestamp: '2026-01-01T00:00:02Z',
      });
      expect(result[3]).toEqual<DelegateEvent>({
        type: 'failed',
        executionId: 'exec-2',
        timestamp: '2026-01-01T00:00:03Z',
      });
    });

    it('should skip empty lines', () => {
      const raw = '\n' + JSON.stringify({ type: 'queued', executionId: 'e1', timestamp: 't1' }) + '\n\n';
      const result = adapter.parseDelegateOutput(raw);
      expect(result).toHaveLength(1);
    });

    it('should return empty array for empty input', () => {
      expect(adapter.parseDelegateOutput('')).toEqual([]);
      expect(adapter.parseDelegateOutput('\n\n')).toEqual([]);
    });

    it('should throw on invalid JSON line', () => {
      const raw = 'bad-json\n';
      expect(() => adapter.parseDelegateOutput(raw)).toThrow();
    });
  });
});
