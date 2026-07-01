import {
	Activity,
	ArrowRight,
	CheckCircle2,
	ClipboardList,
	Code2,
	FolderOpen,
	Loader2,
	Play,
	RefreshCw,
	Search,
	TerminalSquare,
	XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type MaestroRunResult = {
	ok: boolean;
	stdout: string;
	stderr: string;
	exitCode: number | null;
	error?: string;
};

type MaestroCliStatus = {
	available: boolean;
	path: string;
	error?: string;
};

type MaestroStateResult = {
	ok: boolean;
	raw: string;
	path?: string;
	checkedPaths: string[];
	error?: string;
};

type MaestroCodingSessionResult = {
	ok: boolean;
	sessionId: string;
	sessionDir: string;
	statusPath: string;
	error?: string;
};

type MaestroApi = {
	selectProject: () => Promise<string | null>;
	checkCli: () => Promise<MaestroCliStatus>;
	run: (payload: { cwd: string; args: string[] }) => Promise<MaestroRunResult>;
	readState: (cwd: string) => Promise<MaestroStateResult>;
	createCodingSession: (payload: {
		cwd: string;
		task: string;
	}) => Promise<MaestroCodingSessionResult>;
	ralphSession: (payload: {
		cwd: string;
		sessionId?: string;
	}) => Promise<MaestroRunResult>;
	ralphCheck: (payload: {
		cwd: string;
		sessionId?: string;
	}) => Promise<MaestroRunResult>;
	ralphNext: (payload: {
		cwd: string;
		sessionId?: string;
	}) => Promise<MaestroRunResult>;
	ralphComplete: (payload: {
		cwd: string;
		sessionId?: string;
		index: number;
		status: "DONE" | "DONE_WITH_CONCERNS" | "NEEDS_RETRY" | "BLOCKED";
		evidence?: string;
		concerns?: string;
		reason?: string;
	}) => Promise<MaestroRunResult>;
	ralphRetry: (payload: {
		cwd: string;
		sessionId?: string;
		index: number;
	}) => Promise<MaestroRunResult>;
};

type OutputEntry = {
	id: number;
	title: string;
	command: string;
	ok: boolean;
	body: string;
};

type WorkflowStep = {
	id: string;
	title: string;
	detail: string;
	command: string;
	tone: "plan" | "execute" | "review" | "test" | "complete";
};

const DEFAULT_PROJECT = "D:\\WorkSpace\\VsCode\\oh-my-maestro";
const DEFAULT_TASK =
	"实现 apps/desktop 最小可用编码工作流：项目路径、任务输入、链路预览、Ralph session 状态和显式下一步执行入口。";

const CODING_WORKFLOW_STEPS: WorkflowStep[] = [
	{
		id: "plan",
		title: "Plan",
		detail: "把任务转成边界、验收条件和实现步骤。",
		command: "maestro-plan",
		tone: "plan",
	},
	{
		id: "execute",
		title: "Execute",
		detail: "按计划改代码，范围默认收敛在 apps/desktop。",
		command: "maestro-execute",
		tone: "execute",
	},
	{
		id: "review",
		title: "Review",
		detail: "检查命令安全、tRPC/IPC 边界和 UI 闭环。",
		command: "quality-review",
		tone: "review",
	},
	{
		id: "test",
		title: "Test",
		detail: "验证 typecheck、build 和基本页面可用性。",
		command: "quality-test",
		tone: "test",
	},
	{
		id: "complete",
		title: "Complete",
		detail: "收尾 session，记录下一阶段待办。",
		command: "maestro-milestone-complete",
		tone: "complete",
	},
];

const toneClassName: Record<WorkflowStep["tone"], string> = {
	plan: "border-[#3d72a3] bg-[#132334]",
	execute: "border-[#4b8f6b] bg-[#14251d]",
	review: "border-[#9b7a3e] bg-[#2a2112]",
	test: "border-[#8c638f] bg-[#281a2a]",
	complete: "border-[#59636f] bg-[#1d232a]",
};

function formatState(raw: string): string {
	try {
		const parsed = JSON.parse(raw) as {
			project?: { name?: string; description?: string };
			current_milestone?: string | null;
			milestones?: Array<{ id: string; name: string; status: string }>;
			artifacts?: Array<{ id: string; type: string; status?: string }>;
		};
		const activeMilestone = parsed.milestones?.find(
			(milestone) => milestone.id === parsed.current_milestone,
		);
		const recentArtifacts = parsed.artifacts?.slice(-5) ?? [];
		return [
			`Project: ${parsed.project?.name ?? "Unknown"}`,
			`Description: ${parsed.project?.description ?? "-"}`,
			`Current milestone: ${activeMilestone?.name ?? parsed.current_milestone ?? "none"}`,
			`Milestones: ${parsed.milestones?.length ?? 0}`,
			`Artifacts: ${parsed.artifacts?.length ?? 0}`,
			"",
			"Recent artifacts:",
			...recentArtifacts.map(
				(artifact) =>
					`- ${artifact.id} | ${artifact.type} | ${artifact.status ?? "unknown"}`,
			),
		].join("\n");
	} catch {
		return raw;
	}
}

function requireMaestroApi(): MaestroApi {
	const api = (window as Window & { maestro?: MaestroApi }).maestro;
	if (!api) {
		throw new Error("Maestro preload API is unavailable");
	}
	return api;
}

function buildRunBody(result: MaestroRunResult): string {
	return (
		[
			result.stdout.trim(),
			result.stderr.trim(),
			result.error &&
				`Process exited with code ${result.exitCode ?? "unknown"}.\n${result.error}`,
		]
			.filter(Boolean)
			.join("\n\n") || "(no output)"
	);
}

function parseActiveStepIndex(body: string): number | null {
	const activeMatch = body.match(/^active_step_index:\s*(\d+)/m);
	if (activeMatch?.[1]) return Number(activeMatch[1]);
	const stepMatch = body.match(/step\s+(\d+):/);
	if (stepMatch?.[1]) return Number(stepMatch[1]);
	return null;
}

function statusTone(ok?: boolean) {
	if (ok === undefined) return "border-[#34414d] bg-[#171b20] text-[#aebbc5]";
	return ok
		? "border-[#315f43] bg-[#15251b] text-[#7ce29b]"
		: "border-[#6f3a3a] bg-[#2b1717] text-[#ff9a8f]";
}

export function App() {
	const [projectPath, setProjectPath] = useState(DEFAULT_PROJECT);
	const [task, setTask] = useState(DEFAULT_TASK);
	const [query, setQuery] = useState("desktop workflow");
	const [isBusy, setIsBusy] = useState(false);
	const [cliStatus, setCliStatus] = useState<MaestroCliStatus | null>(null);
	const [lastSession, setLastSession] =
		useState<MaestroCodingSessionResult | null>(null);
	const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
	const [evidence, setEvidence] = useState("");
	const [reason, setReason] = useState(
		"当前 step 已由外部 agent 或人工完成，继续推进工作流。",
	);
	const [outputs, setOutputs] = useState<OutputEntry[]>([]);

	const appVersion =
		(window as Window & { App?: { appVersion?: string } }).App?.appVersion ??
		"dev";
	const latestOutput = outputs[0];
	const canRun = !isBusy && projectPath.trim().length > 0;
	const canCreateSession = canRun && task.trim().length >= 8;

	const statusLabel = useMemo(() => {
		if (!cliStatus) return "未检测";
		return cliStatus.available ? "可用" : "不可用";
	}, [cliStatus]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: run CLI check once on mount
	useEffect(() => {
		void checkCli();
	}, []);

	function pushOutput(entry: Omit<OutputEntry, "id">) {
		setOutputs((current) =>
			[{ ...entry, id: Date.now() }, ...current].slice(0, 8),
		);
	}

	async function checkCli() {
		setIsBusy(true);
		try {
			const status = await requireMaestroApi().checkCli();
			setCliStatus(status);
			pushOutput({
				title: "CLI 检测",
				command:
					process.platform === "win32" ? "where maestro" : "which maestro",
				ok: status.available,
				body: status.available
					? `maestro found: ${status.path}`
					: (status.error ?? "maestro CLI not found"),
			});
		} catch (error) {
			pushOutput({
				title: "CLI 检测失败",
				command: "check maestro",
				ok: false,
				body: error instanceof Error ? error.message : String(error),
			});
		} finally {
			setIsBusy(false);
		}
	}

	async function selectProject() {
		const selected = await requireMaestroApi().selectProject();
		if (selected) setProjectPath(selected);
	}

	async function runCommand(title: string, args: string[]) {
		setIsBusy(true);
		try {
			const result = await requireMaestroApi().run({
				cwd: projectPath,
				args,
			});
			pushOutput({
				title,
				command: `maestro ${args.join(" ")}`,
				ok: result.ok,
				body: buildRunBody(result),
			});
		} catch (error) {
			pushOutput({
				title,
				command: `maestro ${args.join(" ")}`,
				ok: false,
				body: error instanceof Error ? error.message : String(error),
			});
		} finally {
			setIsBusy(false);
		}
	}

	async function runRalphAction(
		title: string,
		command: string,
		action: () => Promise<MaestroRunResult>,
	) {
		setIsBusy(true);
		try {
			const result = await action();
			const body = buildRunBody(result);
			const parsedActiveStepIndex = parseActiveStepIndex(body);
			if (parsedActiveStepIndex !== null) {
				setActiveStepIndex(parsedActiveStepIndex);
			}
			pushOutput({
				title,
				command,
				ok: result.ok,
				body,
			});
		} catch (error) {
			pushOutput({
				title,
				command,
				ok: false,
				body: error instanceof Error ? error.message : String(error),
			});
		} finally {
			setIsBusy(false);
		}
	}

	function currentSessionId(): string | undefined {
		return lastSession?.ok ? lastSession.sessionId : undefined;
	}

	async function createCodingSession() {
		setIsBusy(true);
		try {
			const result = await requireMaestroApi().createCodingSession({
				cwd: projectPath,
				task,
			});
			setLastSession(result.ok ? result : null);
			if (result.ok) {
				setActiveStepIndex(null);
			}
			pushOutput({
				title: result.ok ? "Coding session 已创建" : "Coding session 创建失败",
				command: "create ralph coding session",
				ok: result.ok,
				body: result.ok
					? [
							`Session: ${result.sessionId}`,
							`Directory: ${result.sessionDir}`,
							`Status: ${result.statusPath}`,
							"",
							"下一步：点击 Ralph check 验证协议，或点击 Ralph next 加载第一个 plan step。",
						].join("\n")
					: (result.error ?? "Unknown error"),
			});
		} catch (error) {
			pushOutput({
				title: "Coding session 创建失败",
				command: "create ralph coding session",
				ok: false,
				body: error instanceof Error ? error.message : String(error),
			});
		} finally {
			setIsBusy(false);
		}
	}

	async function readState() {
		setIsBusy(true);
		try {
			const result = await requireMaestroApi().readState(projectPath);
			const checkedPaths = result.checkedPaths
				.map((path) => `- ${path}`)
				.join("\n");
			pushOutput({
				title: "Workflow 状态",
				command: "read workflow state",
				ok: result.ok,
				body: result.ok
					? `Source: ${result.path ?? "unknown"}\n\n${formatState(result.raw)}`
					: `${result.error ?? "state not found"}\n\nChecked paths:\n${checkedPaths}`,
			});
		} catch (error) {
			pushOutput({
				title: "Workflow 状态",
				command: "read workflow state",
				ok: false,
				body: error instanceof Error ? error.message : String(error),
			});
		} finally {
			setIsBusy(false);
		}
	}

	return (
		<main className="grid h-screen grid-cols-[340px_1fr] bg-[#111418] text-[#e7ecef]">
			<aside className="flex min-h-0 flex-col border-[#29313a] border-r bg-[#171b20]">
				<div className="border-[#29313a] border-b p-5">
					<div className="flex items-center gap-2 text-[#8ea0ad] text-xs uppercase tracking-[0.18em]">
						<Code2 size={15} />
						Oh My Maestro
					</div>
					<h1 className="mt-3 font-semibold text-2xl text-white">编码工作流</h1>
					<p className="mt-3 text-[#aebbc5] text-sm leading-6">
						把自然语言任务转成 Ralph session，再由你显式推进每一步。
					</p>
				</div>

				<section className="space-y-3 p-5">
					<label className="block text-[#c8d2dc] text-sm">项目目录</label>
					<div className="flex gap-2">
						<input
							className="min-w-0 flex-1 rounded-md border border-[#2d3640] bg-[#0f1216] px-3 py-2 text-sm outline-none ring-[#5aa7ff] focus:ring-2"
							value={projectPath}
							onChange={(event) => setProjectPath(event.target.value)}
						/>
						<button
							className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#34414d] bg-[#202832] text-[#dbe6ef] hover:bg-[#2a3440]"
							type="button"
							onClick={selectProject}
							title="选择目录"
						>
							<FolderOpen size={17} />
						</button>
					</div>
				</section>

				<section className="space-y-3 border-[#29313a] border-t p-5">
					<div className="flex items-center justify-between">
						<span className="text-[#c8d2dc] text-sm">CLI 状态</span>
						<span
							className={
								cliStatus?.available
									? "text-[#69d38a] text-sm"
									: "text-[#f0ba67] text-sm"
							}
						>
							{statusLabel}
						</span>
					</div>
					<div className="truncate text-[#8796a3] text-xs">
						{cliStatus?.path || cliStatus?.error || "等待检测"}
					</div>
					<button
						className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#34414d] bg-[#202832] px-3 py-2 text-sm text-white hover:bg-[#2a3440] disabled:opacity-50"
						type="button"
						disabled={isBusy}
						onClick={checkCli}
					>
						<RefreshCw size={15} />
						重新检测
					</button>
				</section>

				<section className="space-y-3 border-[#29313a] border-t p-5">
					<div className="text-[#c8d2dc] text-sm">当前 session</div>
					<div
						className={`rounded-md border px-3 py-2 text-sm ${statusTone(lastSession?.ok)}`}
					>
						{lastSession?.ok ? lastSession.sessionId : "尚未从页面创建"}
					</div>
					<div className="grid grid-cols-2 gap-2">
						<button
							className="inline-flex items-center justify-center gap-2 rounded-md bg-[#202832] px-3 py-2 text-sm text-white hover:bg-[#2a3440] disabled:opacity-50"
							type="button"
							disabled={!canRun}
							onClick={() =>
								runRalphAction("Ralph session", "maestro ralph session", () =>
									requireMaestroApi().ralphSession({
										cwd: projectPath,
										sessionId: currentSessionId(),
									}),
								)
							}
						>
							<Activity size={15} />
							Session
						</button>
						<button
							className="inline-flex items-center justify-center gap-2 rounded-md bg-[#202832] px-3 py-2 text-sm text-white hover:bg-[#2a3440] disabled:opacity-50"
							type="button"
							disabled={!canRun}
							onClick={() =>
								runRalphAction("Ralph check", "maestro ralph check", () =>
									requireMaestroApi().ralphCheck({
										cwd: projectPath,
										sessionId: currentSessionId(),
									}),
								)
							}
						>
							<CheckCircle2 size={15} />
							Check
						</button>
					</div>
				</section>

				<section className="mt-auto border-[#29313a] border-t p-5 text-[#8796a3] text-xs">
					<div>Desktop shell v{appVersion}</div>
					<div className="mt-1">Branch: rebuild/maestro-visual-shell</div>
				</section>
			</aside>

			<section className="flex min-w-0 flex-col">
				<header className="flex items-center justify-between border-[#29313a] border-b px-6 py-4">
					<div>
						<h2 className="font-medium text-lg text-white">
							Maestro Coding Console
						</h2>
						<p className="text-[#8ea0ad] text-sm">
							默认不调用多模型 delegate；先创建可审计 session，再由你推进。
						</p>
					</div>
					{isBusy ? (
						<div className="flex items-center gap-2 text-[#8fc7ff] text-sm">
							<Loader2 className="animate-spin" size={16} />
							执行中
						</div>
					) : null}
				</header>

				<div className="grid min-h-0 flex-1 grid-cols-[minmax(420px,560px)_1fr] gap-5 p-6">
					<div className="space-y-5">
						<section className="rounded-lg border border-[#29313a] bg-[#171b20] p-4">
							<div className="mb-3 flex items-center gap-2 font-medium text-white">
								<ClipboardList size={18} />
								编码任务
							</div>
							<textarea
								className="min-h-[150px] w-full resize-none rounded-md border border-[#2d3640] bg-[#0f1216] px-3 py-3 text-sm leading-6 outline-none ring-[#5aa7ff] focus:ring-2"
								value={task}
								onChange={(event) => setTask(event.target.value)}
							/>
							<div className="mt-3 flex gap-2">
								<button
									className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-[#23517a] px-4 py-2.5 font-medium text-white hover:bg-[#2d638f] disabled:opacity-50"
									type="button"
									disabled={!canCreateSession}
									onClick={createCodingSession}
								>
									<Play size={16} />
									创建 Ralph coding session
								</button>
								<button
									className="inline-flex items-center justify-center gap-2 rounded-md border border-[#34414d] bg-[#202832] px-4 py-2.5 text-white hover:bg-[#2a3440] disabled:opacity-50"
									type="button"
									disabled={!canRun}
									onClick={() =>
										runRalphAction("Ralph next", "maestro ralph next", () =>
											requireMaestroApi().ralphNext({
												cwd: projectPath,
												sessionId: currentSessionId(),
											}),
										)
									}
								>
									<ArrowRight size={16} />
									Next
								</button>
							</div>
						</section>

						<section className="rounded-lg border border-[#29313a] bg-[#171b20] p-4">
							<div className="mb-3 flex items-center justify-between gap-3">
								<div className="flex items-center gap-2 font-medium text-white">
									<TerminalSquare size={18} />
									Step 控制
								</div>
								<div className="rounded border border-[#3b4652] bg-[#0f1216] px-2 py-1 font-mono text-[#9fb0bf] text-xs">
									active: {activeStepIndex ?? "idle"}
								</div>
							</div>
							<div className="grid grid-cols-[92px_1fr] items-center gap-2">
								<label className="text-[#aebbc5] text-sm">Step</label>
								<input
									className="rounded-md border border-[#2d3640] bg-[#0f1216] px-3 py-2 text-sm outline-none ring-[#5aa7ff] focus:ring-2"
									type="number"
									min={0}
									value={activeStepIndex ?? 0}
									onChange={(event) =>
										setActiveStepIndex(Number(event.target.value))
									}
								/>
								<label className="text-[#aebbc5] text-sm">Evidence</label>
								<input
									className="rounded-md border border-[#2d3640] bg-[#0f1216] px-3 py-2 text-sm outline-none ring-[#5aa7ff] focus:ring-2"
									value={evidence}
									onChange={(event) => setEvidence(event.target.value)}
									placeholder=".workflow/scratch/... 或验证摘要"
								/>
								<label className="text-[#aebbc5] text-sm">Reason</label>
								<input
									className="rounded-md border border-[#2d3640] bg-[#0f1216] px-3 py-2 text-sm outline-none ring-[#5aa7ff] focus:ring-2"
									value={reason}
									onChange={(event) => setReason(event.target.value)}
								/>
							</div>
							<div className="mt-3 grid grid-cols-3 gap-2">
								<button
									className="rounded-md bg-[#2f6f48] px-3 py-2 text-sm text-white hover:bg-[#3b8156] disabled:opacity-50"
									type="button"
									disabled={!canRun || activeStepIndex === null}
									onClick={() =>
										runRalphAction(
											"Step DONE",
											`maestro ralph complete ${activeStepIndex} --status DONE`,
											() =>
												requireMaestroApi().ralphComplete({
													cwd: projectPath,
													sessionId: currentSessionId(),
													index: activeStepIndex ?? 0,
													status: "DONE",
													evidence: evidence.trim() || undefined,
												}),
										)
									}
								>
									Mark DONE
								</button>
								<button
									className="rounded-md bg-[#7a4f23] px-3 py-2 text-sm text-white hover:bg-[#8f612d] disabled:opacity-50"
									type="button"
									disabled={!canRun || activeStepIndex === null}
									onClick={() =>
										runRalphAction(
											"Step retry",
											`maestro ralph retry ${activeStepIndex}`,
											() =>
												requireMaestroApi().ralphRetry({
													cwd: projectPath,
													sessionId: currentSessionId(),
													index: activeStepIndex ?? 0,
												}),
										)
									}
								>
									Retry
								</button>
								<button
									className="rounded-md bg-[#6f3333] px-3 py-2 text-sm text-white hover:bg-[#814040] disabled:opacity-50"
									type="button"
									disabled={!canRun || activeStepIndex === null}
									onClick={() =>
										runRalphAction(
											"Step BLOCKED",
											`maestro ralph complete ${activeStepIndex} --status BLOCKED`,
											() =>
												requireMaestroApi().ralphComplete({
													cwd: projectPath,
													sessionId: currentSessionId(),
													index: activeStepIndex ?? 0,
													status: "BLOCKED",
													reason,
												}),
										)
									}
								>
									Mark BLOCKED
								</button>
							</div>
						</section>

						<section className="rounded-lg border border-[#29313a] bg-[#171b20] p-4">
							<div className="mb-4 flex items-center gap-2 font-medium text-white">
								<Activity size={18} />
								工作流链路
							</div>
							<div className="space-y-2">
								{CODING_WORKFLOW_STEPS.map((step, index) => (
									<div
										key={step.id}
										className={`grid grid-cols-[34px_1fr] gap-3 rounded-md border p-3 ${toneClassName[step.tone]}`}
									>
										<div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0f1216] font-semibold text-[#dbe6ef] text-sm">
											{index + 1}
										</div>
										<div className="min-w-0">
											<div className="flex items-center justify-between gap-2">
												<div className="font-medium text-white">
													{step.title}
												</div>
												<div className="shrink-0 rounded border border-[#3b4652] bg-[#0f1216] px-2 py-0.5 font-mono text-[#9fb0bf] text-xs">
													{step.command}
												</div>
											</div>
											<p className="mt-1 text-[#aebbc5] text-sm">
												{step.detail}
											</p>
										</div>
									</div>
								))}
							</div>
						</section>

						<section className="rounded-lg border border-[#29313a] bg-[#171b20] p-4">
							<div className="mb-3 flex items-center gap-2 font-medium text-white">
								<Search size={18} />
								辅助查询
							</div>
							<div className="flex gap-2">
								<input
									className="min-w-0 flex-1 rounded-md border border-[#2d3640] bg-[#0f1216] px-3 py-2 text-sm outline-none ring-[#5aa7ff] focus:ring-2"
									value={query}
									onChange={(event) => setQuery(event.target.value)}
									onKeyDown={(event) => {
										if (event.key === "Enter" && canRun && query.trim()) {
											void runCommand("知识搜索", ["search", query]);
										}
									}}
								/>
								<button
									className="rounded-md bg-[#202832] px-4 py-2 text-sm text-white hover:bg-[#2a3440] disabled:opacity-50"
									type="button"
									disabled={!canRun || query.trim().length === 0}
									onClick={() => runCommand("知识搜索", ["search", query])}
								>
									Search
								</button>
							</div>
						</section>
					</div>

					<div className="flex min-h-0 flex-col rounded-lg border border-[#29313a] bg-[#0f1216]">
						<div className="flex items-center justify-between border-[#29313a] border-b px-4 py-3">
							<div className="font-medium text-white">运行输出</div>
							<div className="flex items-center gap-2">
								<button
									className="rounded-md border border-[#34414d] bg-[#171b20] px-3 py-1.5 text-[#dbe6ef] text-xs hover:bg-[#202832] disabled:opacity-50"
									type="button"
									disabled={!canRun}
									onClick={readState}
								>
									Workflow state
								</button>
								<button
									className="rounded-md border border-[#34414d] bg-[#171b20] px-3 py-1.5 text-[#dbe6ef] text-xs hover:bg-[#202832] disabled:opacity-50"
									type="button"
									disabled={!canRun}
									onClick={() =>
										runCommand("Ralph skills", ["ralph", "skills"])
									}
								>
									Skills
								</button>
							</div>
						</div>
						<div className="min-h-0 flex-1 overflow-auto p-4">
							{latestOutput ? (
								<div>
									<div className="mb-3 flex items-center gap-2">
										{latestOutput.ok ? (
											<CheckCircle2 className="text-[#69d38a]" size={18} />
										) : (
											<XCircle className="text-[#ff7b72]" size={18} />
										)}
										<div>
											<div className="font-medium text-white">
												{latestOutput.title}
											</div>
											<div className="text-[#8796a3] text-xs">
												{latestOutput.command}
											</div>
										</div>
									</div>
									<pre className="min-h-[520px] whitespace-pre-wrap rounded-md border border-[#252d36] bg-[#090b0e] p-4 font-mono text-[#dce7ef] text-sm leading-6">
										{latestOutput.body}
									</pre>
								</div>
							) : (
								<div className="flex h-full items-center justify-center px-8 text-center text-[#8796a3]">
									创建 coding session 后，这里会显示 session 路径、check 结果和
									next 输出。
								</div>
							)}
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
