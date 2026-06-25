// Phase 3 stub — replace with @maestro/port-scanner in Phase 4
import { treeKillWithEscalation } from "../tree-kill";

class PortManager {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private killFn: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(opts: { killFn: any }) {
    this.killFn = opts.killFn;
  }
  upsertSession(..._args: unknown[]): void {}
  unregisterSession(..._args: unknown[]): void {}
  checkOutputForHint(..._args: unknown[]): void {}
}

export const portManager = new PortManager({
  killFn: treeKillWithEscalation,
});
