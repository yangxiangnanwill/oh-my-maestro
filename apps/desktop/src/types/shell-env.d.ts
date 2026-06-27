declare module "shell-env" {
	export function shellEnv(): Promise<Record<string, string>>;
}
