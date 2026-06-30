import {
	Activity,
	CheckCircle2,
	FolderOpen,
	Loader2,
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

type MaestroApi = {
	selectProject: () => Promise<string | null>;
	checkCli: () => Promise<MaestroCliStatus>;
	run: (payload: { cwd: string; args: string[] }) => Promise<MaestroRunResult>;
	readState: (cwd: string) => Promise<MaestroStateResult>;
};

type OutputEntry = {
	id: number;
	title: string;
	command: string;
	ok: boolean;
	body: string;
};

const DEFAULT_PROJECT = "D:\\WorkSpace\\VsCode\\oh-my-maestro";

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

export function App() {
	const [projectPath, setProjectPath] = useState(DEFAULT_PROJECT);
	const [query, setQuery] = useState("Maestro-flow");
	const [isBusy, setIsBusy] = useState(false);
	const [cliStatus, setCliStatus] = useState<MaestroCliStatus | null>(null);
	const [outputs, setOutputs] = useState<OutputEntry[]>([]);

	const appVersion =
		(window as Window & { App?: { appVersion?: string } }).App?.appVersion ??
		"dev";
	const latestOutput = outputs[0];
	const canRun = !isBusy && projectPath.trim().length > 0;

	const statusLabel = useMemo(() => {
		if (!cliStatus) return "未检测";
		return cliStatus.available ? "可用" : "不可用";
	}, [cliStatus]);

	useEffect(() => {
		void checkCli();
	}, []);

	function pushOutput(entry: Omit<OutputEntry, "id">) {
		setOutputs((current) => [{ ...entry, id: Date.now() }, ...current].slice(0, 8));
	}

	async function checkCli() {
		setIsBusy(true);
		try {
			const status = await requireMaestroApi().checkCli();
			setCliStatus(status);
			pushOutput({
				title: "CLI 检测",
				command: process.platform === "win32" ? "where maestro" : "which maestro",
				ok: status.available,
				body: status.available
					? `maestro found: ${status.path}`
					: status.error ?? "maestro CLI not found",
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
				body:
					[
						result.stdout.trim(),
						result.stderr.trim(),
						result.error &&
							`Process exited with code ${result.exitCode ?? "unknown"}.\n${result.error}`,
					]
						.filter(Boolean)
						.join("\n\n") || "(no output)",
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
		<main className="grid h-screen grid-cols-[320px_1fr] bg-[#111418] text-[#e7ecef]">
			<aside className="flex min-h-0 flex-col border-[#29313a] border-r bg-[#171b20]">
				<div className="border-[#29313a] border-b p-5">
					<div className="text-xs uppercase tracking-[0.2em] text-[#8ea0ad]">
						Oh My Maestro
					</div>
					<h1 className="mt-2 font-semibold text-2xl text-white">
						Maestro-flow 工作台
					</h1>
					<p className="mt-3 text-[#aebbc5] text-sm leading-6">
						先验证引擎包装层：选择项目，调用 CLI，读取 workflow 状态。
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
				</section>

				<section className="mt-auto border-[#29313a] border-t p-5 text-[#8796a3] text-xs">
					<div>Desktop shell v{appVersion}</div>
					<div className="mt-1">Branch: rebuild/maestro-visual-shell</div>
				</section>
			</aside>

			<section className="flex min-w-0 flex-col">
				<header className="flex items-center justify-between border-[#29313a] border-b px-6 py-4">
					<div>
						<h2 className="font-medium text-lg text-white">引擎适配验证</h2>
						<p className="text-[#8ea0ad] text-sm">
							本阶段只跑 Maestro-flow CLI，不接入 Superset runtime。
						</p>
					</div>
					{isBusy ? (
						<div className="flex items-center gap-2 text-[#8fc7ff] text-sm">
							<Loader2 className="animate-spin" size={16} />
							执行中
						</div>
					) : null}
				</header>

				<div className="grid min-h-0 flex-1 grid-cols-[minmax(360px,480px)_1fr] gap-5 p-6">
					<div className="space-y-5">
						<div className="rounded-lg border border-[#29313a] bg-[#171b20] p-4">
							<div className="mb-4 flex items-center gap-2 font-medium text-white">
								<Activity size={18} />
								快捷动作
							</div>
							<div className="grid gap-3">
								<button
									className="flex items-center justify-between rounded-md bg-[#23517a] px-4 py-3 text-left text-white hover:bg-[#2d638f] disabled:opacity-50"
									type="button"
									disabled={!canRun}
									onClick={checkCli}
								>
									<span>检测 maestro CLI</span>
									<TerminalSquare size={17} />
								</button>
								<button
									className="flex items-center justify-between rounded-md bg-[#202832] px-4 py-3 text-left text-white hover:bg-[#2a3440] disabled:opacity-50"
									type="button"
									disabled={!canRun}
									onClick={readState}
								>
									<span>读取 workflow 状态</span>
									<Activity size={17} />
								</button>
								<button
									className="flex items-center justify-between rounded-md bg-[#202832] px-4 py-3 text-left text-white hover:bg-[#2a3440] disabled:opacity-50"
									type="button"
									disabled={!canRun}
									onClick={() => runCommand("Ralph session", ["ralph", "session"])}
								>
									<span>Ralph session</span>
									<TerminalSquare size={17} />
								</button>
								<button
									className="flex items-center justify-between rounded-md bg-[#202832] px-4 py-3 text-left text-white hover:bg-[#2a3440] disabled:opacity-50"
									type="button"
									disabled={!canRun}
									onClick={() => runCommand("Ralph check", ["ralph", "check"])}
								>
									<span>Ralph check</span>
									<TerminalSquare size={17} />
								</button>
								<button
									className="flex items-center justify-between rounded-md bg-[#202832] px-4 py-3 text-left text-white hover:bg-[#2a3440] disabled:opacity-50"
									type="button"
									disabled={!canRun}
									onClick={() => runCommand("Ralph skills", ["ralph", "skills"])}
								>
									<span>Ralph skills</span>
									<TerminalSquare size={17} />
								</button>
							</div>
						</div>

						<div className="rounded-lg border border-[#29313a] bg-[#171b20] p-4">
							<div className="mb-3 flex items-center gap-2 font-medium text-white">
								<Search size={18} />
								知识搜索
							</div>
							<input
								className="mb-3 w-full rounded-md border border-[#2d3640] bg-[#0f1216] px-3 py-2 text-sm outline-none ring-[#5aa7ff] focus:ring-2"
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === "Enter" && canRun) {
										void runCommand("知识搜索", ["search", query]);
									}
								}}
							/>
							<button
								className="w-full rounded-md bg-[#23517a] px-4 py-2 font-medium text-white hover:bg-[#2d638f] disabled:opacity-50"
								type="button"
								disabled={!canRun || query.trim().length === 0}
								onClick={() => runCommand("知识搜索", ["search", query])}
							>
								执行 maestro search
							</button>
						</div>
					</div>

					<div className="flex min-h-0 flex-col rounded-lg border border-[#29313a] bg-[#0f1216]">
						<div className="flex items-center justify-between border-[#29313a] border-b px-4 py-3">
							<div className="font-medium text-white">输出</div>
							<div className="text-[#8796a3] text-xs">{outputs.length} 条记录</div>
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
									<pre className="min-h-[420px] whitespace-pre-wrap rounded-md border border-[#252d36] bg-[#090b0e] p-4 font-mono text-[#dce7ef] text-sm leading-6">
										{latestOutput.body}
									</pre>
								</div>
							) : (
								<div className="flex h-full items-center justify-center text-[#8796a3]">
									选择动作后显示 Maestro-flow 输出。
								</div>
							)}
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
