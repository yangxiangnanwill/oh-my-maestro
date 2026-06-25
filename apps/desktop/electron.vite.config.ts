import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import reactPlugin from "@vitejs/plugin-react";
import { config } from "dotenv";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import injectProcessEnvPlugin from "rollup-plugin-inject-process-env";
import tsconfigPathsPlugin from "vite-tsconfig-paths";
import { version } from "./package.json";
import { mainExternalizedDependencies } from "./runtime-dependencies";

// override: true ensures .env values take precedence over inherited env vars
config({ path: resolve(__dirname, "../../.env"), override: true, quiet: true });

const DEV_SERVER_PORT = Number(process.env.DESKTOP_VITE_PORT) || 5173;

const tsconfigPaths = tsconfigPathsPlugin({
	projects: [resolve("tsconfig.json")],
});

export default defineConfig({
	main: {
		plugins: [tsconfigPaths],

		define: {
			"process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "production"),
			"process.env.SKIP_ENV_VALIDATION": JSON.stringify(
				process.env.SKIP_ENV_VALIDATION || "",
			),
			"process.env.DESKTOP_VITE_PORT": JSON.stringify(process.env.DESKTOP_VITE_PORT || "5173"),
		},

		build: {
			sourcemap: true,
			rollupOptions: {
				input: {
					index: resolve("src/main/index.ts"),
				},
				output: {
					dir: resolve("dist", "main"),
				},
				external: ["electron", ...mainExternalizedDependencies],
			},
		},
	},

	preload: {
		plugins: [
			tsconfigPaths,
			externalizeDepsPlugin(),
		],

		define: {
			"process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "production"),
			__APP_VERSION__: JSON.stringify(version),
		},

		build: {
			outDir: resolve("dist", "preload"),
			rollupOptions: {
				input: {
					index: resolve("src/preload/index.ts"),
				},
			},
		},
	},

	renderer: {
		define: {
			"process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "production"),
			"process.platform": JSON.stringify(process.platform),
			"import.meta.env.DEV_SERVER_PORT": JSON.stringify(String(DEV_SERVER_PORT)),
		},

		server: {
			port: DEV_SERVER_PORT,
			strictPort: false,
		},

		plugins: [
			tanstackRouter({
				target: "react",
				routesDirectory: resolve("src/renderer/routes"),
				generatedRouteTree: resolve("src/renderer/routeTree.gen.ts"),
				indexToken: "page",
				routeToken: "layout",
				autoCodeSplitting: true,
				routeFileIgnorePattern:
					"^(?!(__root|page|layout)\\.tsx$).*\\.(tsx?|jsx?)$",
			}),
			tsconfigPaths,
			tailwindcss(),
			reactPlugin(),
		],

		worker: {
			format: "es",
		},

		build: {
			sourcemap: true,
			outDir: resolve("dist", "renderer"),

			rollupOptions: {
				plugins: [
					injectProcessEnvPlugin({
						NODE_ENV: "production",
						platform: process.platform,
					}),
				],

				input: {
					index: resolve("src/renderer/index.html"),
				},
			},
		},
	},
});
