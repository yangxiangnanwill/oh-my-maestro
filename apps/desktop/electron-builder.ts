/**
 * Electron Builder Configuration for Maestro IDE
 * @see https://www.electron.build/configuration/configuration
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import pkg from "./package.json";
import {
	packagedAsarUnpackGlobs,
	packagedNodeModuleCopies,
} from "./runtime-dependencies";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Configuration = any;

const currentYear = new Date().getFullYear();
const author = pkg.author?.name ?? pkg.author;
const productName = pkg.productName;
const macIconPath = join(pkg.resources, "build/icons/icon.icns");
const linuxIconPath = join(pkg.resources, "build/icons");
const winIconPath = join(pkg.resources, "build/icons/icon.ico");

const config: Configuration = {
	appId: "com.maestro-flow.desktop",
	productName,
	copyright: `Copyright © ${currentYear} — ${author}`,
	electronVersion: pkg.devDependencies.electron.replace(/^\^/, ""),

	// Publish to GitHub Releases
	publish: {
		provider: "github",
		owner: "yangxiangnanwill",
		repo: "oh-my-maestro",
	},

	// Directories
	directories: {
		output: "release",
		buildResources: join(pkg.resources, "build"),
	},

	// ASAR configuration for native modules
	asar: true,
	asarUnpack: [
		...packagedAsarUnpackGlobs,
	],

	files: [
		"dist/**/*",
		"package.json",
		{
			from: pkg.resources,
			to: "resources",
			filter: ["**/*"],
		},
		...packagedNodeModuleCopies,
		"!**/.DS_Store",
	],

	// Rebuild native modules for Electron's Node.js version
	npmRebuild: true,

	// macOS
	mac: {
		...(existsSync(macIconPath) ? { icon: macIconPath } : {}),
		category: "public.app-category.utilities",
		target: "default",
		hardenedRuntime: true,
		gatekeeperAssess: false,
		extendInfo: {
			CFBundleName: productName,
			CFBundleDisplayName: productName,
		},
	},

	// Deep linking protocol
	protocols: {
		name: productName,
		schemes: ["maestro"],
	},

	// Linux
	linux: {
		...(existsSync(linuxIconPath) ? { icon: linuxIconPath } : {}),
		category: "Utility",
		synopsis: pkg.description,
		target: ["AppImage"],
		artifactName: `Maestro-\${version}-\${arch}.\${ext}`,
	},

	// Windows
	win: {
		...(existsSync(winIconPath) ? { icon: winIconPath } : {}),
		target: [
			{
				target: "nsis",
				arch: ["x64"],
			},
		],
		artifactName: `${productName}-\${version}-\${arch}.\${ext}`,
	},

	// NSIS installer (Windows)
	nsis: {
		oneClick: false,
		allowToChangeInstallationDirectory: true,
	},
};

export default config;
