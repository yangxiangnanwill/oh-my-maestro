import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import reactPlugin from "@vitejs/plugin-react";
import { config } from "dotenv";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import tsconfigPathsPlugin from "vite-tsconfig-paths";
import { version } from "./package.json";

// override: true ensures .env values take precedence over inherited env vars
config({ path: resolve(__dirname, "../../.env"), override: true, quiet: true });

const DEV_SERVER_PORT = Number(process.env.DESKTOP_VITE_PORT) || 5173;

const tsconfigPaths = tsconfigPathsPlugin({
	projects: [resolve("tsconfig.json")],
});

const workspaceDependencies = Object.keys({}).filter((dependency) =>
	dependency.startsWith("@oh-my-maestro/"),
);

function defineEnv(value: string | undefined, fallback?: string): string {
	return JSON.stringify(value ?? fallback ?? "");
}

const devPath = resolve("dist");

export default defineConfig({
	main: {
		plugins: [tsconfigPaths],

		define: {
			"process.env.NODE_ENV": defineEnv(process.env.NODE_ENV, "production"),
			"process.env.SKIP_ENV_VALIDATION": defineEnv(
				process.env.SKIP_ENV_VALIDATION,
				"",
			),
			"process.env.NEXT_PUBLIC_API_URL": defineEnv(
				process.env.NEXT_PUBLIC_API_URL,
				"https://api.maestro-flow.dev",
			),
			"process.env.NEXT_PUBLIC_WEB_URL": defineEnv(
				process.env.NEXT_PUBLIC_WEB_URL,
				"https://app.maestro-flow.dev",
			),
			"process.env.NEXT_PUBLIC_MARKETING_URL": defineEnv(
				process.env.NEXT_PUBLIC_MARKETING_URL,
				"https://maestro-flow.dev",
			),
			"process.env.NEXT_PUBLIC_DOCS_URL": defineEnv(
				process.env.NEXT_PUBLIC_DOCS_URL,
				"https://docs.maestro-flow.dev",
			),
			"process.env.RELAY_URL": defineEnv(process.env.RELAY_URL),
			"process.env.DESKTOP_VITE_PORT": defineEnv(process.env.DESKTOP_VITE_PORT),
			"process.env.DESKTOP_NOTIFICATIONS_PORT": defineEnv(
				process.env.DESKTOP_NOTIFICATIONS_PORT,
			),
		},

		build: {
			sourcemap: true,
			rollupOptions: {
				input: {
					index: resolve("src/main/index.ts"),
				},
				output: {
					dir: resolve(devPath, "main"),
				},
				external: ["electron"],
			},
		},
	},

	preload: {
		plugins: [
			tsconfigPaths,
			externalizeDepsPlugin({
				exclude: [...workspaceDependencies],
			}),
		],

		define: {
			"process.env.NODE_ENV": defineEnv(process.env.NODE_ENV, "production"),
			"process.env.SKIP_ENV_VALIDATION": defineEnv(
				process.env.SKIP_ENV_VALIDATION,
				"",
			),
			__APP_VERSION__: defineEnv(version),
		},

		build: {
			outDir: resolve(devPath, "preload"),
			rollupOptions: {
				input: {
					index: resolve("src/preload/index.ts"),
				},
				output: {
					format: "cjs",
				},
			},
		},
	},

	renderer: {
		define: {
			"process.env.NODE_ENV": defineEnv(process.env.NODE_ENV),
			"process.env.SKIP_ENV_VALIDATION": defineEnv(
				process.env.SKIP_ENV_VALIDATION,
				"",
			),
			"process.platform": defineEnv(process.platform),
			"process.env.NEXT_PUBLIC_API_URL": defineEnv(
				process.env.NEXT_PUBLIC_API_URL,
				"https://api.maestro-flow.dev",
			),
			"process.env.NEXT_PUBLIC_WEB_URL": defineEnv(
				process.env.NEXT_PUBLIC_WEB_URL,
				"https://app.maestro-flow.dev",
			),
			"process.env.NEXT_PUBLIC_MARKETING_URL": defineEnv(
				process.env.NEXT_PUBLIC_MARKETING_URL,
				"https://maestro-flow.dev",
			),
			"process.env.NEXT_PUBLIC_DOCS_URL": defineEnv(
				process.env.NEXT_PUBLIC_DOCS_URL,
				"https://docs.maestro-flow.dev",
			),
			"import.meta.env.DEV_SERVER_PORT": defineEnv(String(DEV_SERVER_PORT)),
			"process.env.RELAY_URL": defineEnv(process.env.RELAY_URL),
			"process.env.DESKTOP_VITE_PORT": defineEnv(process.env.DESKTOP_VITE_PORT),
			"process.env.DESKTOP_NOTIFICATIONS_PORT": defineEnv(
				process.env.DESKTOP_NOTIFICATIONS_PORT,
			),
		},

		server: {
			port: DEV_SERVER_PORT,
			strictPort: false,
		},

		plugins: [
			tsconfigPaths,
			tailwindcss(),
			reactPlugin(),
		],

		worker: {
			format: "es",
		},

		build: {
			sourcemap: true,
			outDir: resolve(devPath, "renderer"),

			rollupOptions: {
				input: {
					index: resolve("src/renderer/index.html"),
				},
			},
		},
	},
});
