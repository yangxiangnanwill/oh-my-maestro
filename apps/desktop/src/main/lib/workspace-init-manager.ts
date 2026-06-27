import { EventEmitter } from "node:events";
import type {
	WorkspaceInitProgress,
	WorkspaceInitStep,
} from "shared/types/workspace-init";

interface InitJob {
	workspaceId: string;
	projectId: string;
	progress: WorkspaceInitProgress;
	cancelled: boolean;
	worktreeCreated: boolean;
}

/**
 * Manages workspace initialization jobs with:
 * - Progress tracking and streaming via EventEmitter
 * - Cancellation support
 * - Per-project mutex to prevent concurrent git operations
 *
 * This is an in-memory manager - state is NOT persisted across app restarts.
 * If the app restarts during initialization, the workspace may be left in
 * an incomplete state requiring manual cleanup (documented limitation).
 */
class WorkspaceInitManager extends EventEmitter {
	private jobs = new Map<string, InitJob>();
	private projectLocks = new Map<string, Promise<void>>();
	private projectLockResolvers = new Map<string, () => void>();

	private donePromises = new Map<string, Promise<void>>();
	private doneResolvers = new Map<string, () => void>();
	private cancellations = new Set<string>();

	isInitializing(workspaceId: string): boolean {
		const job = this.jobs.get(workspaceId);
		return (
			job !== undefined &&
			job.progress.step !== "ready" &&
			job.progress.step !== "failed"
		);
	}

	hasFailed(workspaceId: string): boolean {
		const job = this.jobs.get(workspaceId);
		return job?.progress.step === "failed";
	}

	getProgress(workspaceId: string): WorkspaceInitProgress | undefined {
		return this.jobs.get(workspaceId)?.progress;
	}

	getAllProgress(): WorkspaceInitProgress[] {
		return Array.from(this.jobs.values()).map((job) => job.progress);
	}

	startJob(workspaceId: string, projectId: string): void {
		if (this.jobs.has(workspaceId)) {
			console.warn(
				`[workspace-init] Job already exists for ${workspaceId}, clearing old job`,
			);
			this.jobs.delete(workspaceId);
		}

		this.cancellations.delete(workspaceId);

		let resolve: () => void;
		const promise = new Promise<void>((r) => {
			resolve = r;
		});
		this.donePromises.set(workspaceId, promise);
		this.doneResolvers.set(workspaceId, resolve!);

		const progress: WorkspaceInitProgress = {
			workspaceId,
			step: "syncing" as WorkspaceInitStep,
			message: "Preparing...",
		};

		this.jobs.set(workspaceId, {
			workspaceId,
			projectId,
			progress,
			cancelled: false,
			worktreeCreated: false,
		});

		this.emit("progress", progress);
	}

	updateProgress(
		workspaceId: string,
		step: WorkspaceInitStep,
		message: string,
		error?: string,
		warning?: string,
	): void {
		const job = this.jobs.get(workspaceId);
		if (!job) {
			console.warn(`[workspace-init] No job found for ${workspaceId}`);
			return;
		}

		job.progress = {
			...job.progress,
			step,
			message,
			error,
			warning,
		};

		this.emit("progress", job.progress);

		if (step === "ready") {
			const timer = setTimeout(() => {
				if (this.jobs.get(workspaceId)?.progress.step === "ready") {
					this.jobs.delete(workspaceId);
				}
			}, 2000);
			timer.unref();
		}
	}

	markWorktreeCreated(workspaceId: string): void {
		const job = this.jobs.get(workspaceId);
		if (job) {
			job.worktreeCreated = true;
		}
	}

	wasWorktreeCreated(workspaceId: string): boolean {
		return this.jobs.get(workspaceId)?.worktreeCreated ?? false;
	}

	cancel(workspaceId: string): void {
		this.cancellations.add(workspaceId);

		const job = this.jobs.get(workspaceId);
		if (job) {
			job.cancelled = true;
		}
		console.log(`[workspace-init] Cancelled job for ${workspaceId}`);
	}

	isCancelled(workspaceId: string): boolean {
		return this.jobs.get(workspaceId)?.cancelled ?? false;
	}

	isCancellationRequested(workspaceId: string): boolean {
		return this.cancellations.has(workspaceId);
	}

	clearJob(workspaceId: string): void {
		this.jobs.delete(workspaceId);
		this.donePromises.delete(workspaceId);
		this.doneResolvers.delete(workspaceId);
		this.cancellations.delete(workspaceId);
	}

	finalizeJob(workspaceId: string): void {
		const resolve = this.doneResolvers.get(workspaceId);
		if (resolve) {
			resolve();
			console.log(`[workspace-init] Finalized job for ${workspaceId}`);
		}

		this.donePromises.delete(workspaceId);
		this.doneResolvers.delete(workspaceId);
	}

	async waitForInit(workspaceId: string, timeoutMs = 30000): Promise<void> {
		const promise = this.donePromises.get(workspaceId);
		if (!promise) {
			return;
		}

		console.log(
			`[workspace-init] Waiting for init to complete: ${workspaceId}`,
		);

		await Promise.race([
			promise,
			new Promise<void>((resolve) => {
				setTimeout(() => {
					console.warn(
						`[workspace-init] Wait timed out after ${timeoutMs}ms for ${workspaceId}`,
					);
					resolve();
				}, timeoutMs);
			}),
		]);
	}

	async acquireProjectLock(projectId: string): Promise<void> {
		while (this.projectLocks.has(projectId)) {
			await this.projectLocks.get(projectId);
		}

		let resolve: () => void;
		const promise = new Promise<void>((r) => {
			resolve = r;
		});

		this.projectLocks.set(projectId, promise);
		this.projectLockResolvers.set(projectId, resolve!);
	}

	releaseProjectLock(projectId: string): void {
		const resolve = this.projectLockResolvers.get(projectId);
		if (resolve) {
			this.projectLocks.delete(projectId);
			this.projectLockResolvers.delete(projectId);
			resolve();
		}
	}

	hasProjectLock(projectId: string): boolean {
		return this.projectLocks.has(projectId);
	}
}

/** Singleton workspace initialization manager instance */
export const workspaceInitManager = new WorkspaceInitManager();
