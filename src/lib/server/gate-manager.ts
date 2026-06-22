// Maestro IDE — GateManager (Approval Gate State Machine)

import type { EventBus } from './event-bus.js';
import type { DelegateExecutor } from './delegate-executor.js';
import type { ApprovalGate, GateStatus } from '../shared/types.js';
import { Channels, GateEvents } from '../shared/events.js';

/** 超时时间（毫秒） */
const GATE_TIMEOUT_MS = 30_000;

/**
 * GateManager — 管理审批门控的完整生命周期。
 *
 * 状态机：pending → presented → approved | rejected | expired
 * - createGate: 创建门控 → 发布 gate:pending 事件到 EventBus
 * - resolveGate: 确认/拒绝 → 发布 gate:resolved 事件
 * - 30s 超时自动拒绝
 */
export class GateManager {
  private gates = new Map<string, ApprovalGate>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private counter = 0;

  constructor(
    private eventBus: EventBus,
    private delegateExecutor: DelegateExecutor,
  ) {}

  /**
   * 创建一个审批门控。
   * 先执行 dry-run 分析，然后创建 gate 对象并发布 gate:pending 事件。
   *
   * @param executionId - 对应工作流执行 ID
   * @param stepIndex - 步骤索引
   * @param dryRunResult - dry-run 输出字符串
   * @returns 创建的 ApprovalGate 对象
   */
  createGate(
    executionId: string,
    stepIndex: number,
    dryRunResult: string,
  ): ApprovalGate {
    const gateId = `gate-${++this.counter}-${Date.now()}`;

    const gate: ApprovalGate = {
      gateId,
      executionId,
      stepIndex,
      status: 'pending',
      dryRunResult,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    };

    this.gates.set(gateId, gate);

    // 发布 gate:pending 事件（客户端据此展示 ApprovalPanel）
    this.eventBus.publish(
      GateEvents.PENDING,
      Channels.GATE,
      { ...gate },
      'server',
    );

    // 更新状态为 presented（面板已展示）
    this.updateStatus(gateId, 'presented');

    // 启动 30s 超时定时器
    const timer = setTimeout(() => {
      this.resolveGate(gateId, false, 'expired');
    }, GATE_TIMEOUT_MS);
    this.timers.set(gateId, timer);

    return gate;
  }

  /**
   * 解析审批门控（确认或拒绝）。
   *
   * @param gateId - 门控 ID
   * @param approved - 是否确认
   * @param forceStatus - 强制设置状态（超时场景使用 'expired'）
   */
  resolveGate(
    gateId: string,
    approved: boolean,
    forceStatus?: 'expired',
  ): ApprovalGate | undefined {
    const gate = this.gates.get(gateId);
    if (!gate) return undefined;

    // 仅 presented 状态的 gate 可以被解析
    if (gate.status !== 'presented') return gate;

    // 清除超时定时器
    this.clearTimer(gateId);

    const targetStatus: GateStatus = forceStatus
      ? 'expired'
      : approved
        ? 'approved'
        : 'rejected';

    this.updateStatus(gateId, targetStatus);
    gate.resolvedAt = new Date().toISOString();

    // 发布 gate:resolved 事件
    this.eventBus.publish(
      GateEvents.RESOLVED,
      Channels.GATE,
      { ...gate },
      'server',
    );

    return gate;
  }

  /**
   * 通过门控 ID 获取当前状态。
   */
  getGate(gateId: string): ApprovalGate | undefined {
    return this.gates.get(gateId);
  }

  /**
   * 清理指定门控（从内存中移除）。
   */
  clearGate(gateId: string): void {
    this.clearTimer(gateId);
    this.gates.delete(gateId);
  }

  /**
   * 清理所有门控。
   */
  clearAll(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.gates.clear();
  }

  /**
   * 构建 dry-run prompt 字符串。
   */
  buildDryRunPrompt(
    workflowId: string,
    params: Record<string, unknown>,
  ): string {
    const paramsStr = Object.entries(params)
      .filter(([key]) => key !== 'tool') // tool is passed as --to flag
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join(' ');
    return paramsStr
      ? `${workflowId} ${paramsStr}`
      : workflowId;
  }

  /**
   * 执行 dry-run 分析。
   * 委托给 DelegateExecutor.executeDryRun() 并返回结果。
   */
  async performDryRun(
    workflowId: string,
    params: Record<string, unknown>,
  ): Promise<string> {
    const prompt = this.buildDryRunPrompt(workflowId, params);
    return this.delegateExecutor.executeDryRun(
      prompt,
      (params.tool as string) ?? 'claude',
    );
  }

  // ── 私有方法 ──

  /** 更新 gate 状态字段 */
  private updateStatus(gateId: string, status: GateStatus): void {
    const gate = this.gates.get(gateId);
    if (gate) {
      gate.status = status;
    }
  }

  /** 清除指定 gate 的超时定时器 */
  private clearTimer(gateId: string): void {
    const timer = this.timers.get(gateId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(gateId);
    }
  }
}
