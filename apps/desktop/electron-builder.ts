/**
 * Electron Builder Configuration for Maestro IDE
 * @see https://www.electron.build/configuration/configuration
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Configuration } from "electron-builder";
import pkg from "./package.json";
import {
	packagedAsarUnpackGlobs,
	packagedNodeModuleCopies,
} from "./runtime-dependencies";

const currentYear = new Date().getFullYear();
const author = pkg.author?.name ?? pkg.author;
const productName = pkg.productName;
const winIconPath = join(pkg.resources, "build/icons/icon.ico");

const config: Configuration = {
	appId: "com.maestro-flow.desktop",
	productName,
	copyright: `Copyright © ${currentYear} — ${author}`,
	electronVersion: pkg.devDependencies.electron.replace(/^\^/, ""),

	// Generate update manifests for all channels
	generateUpdatesFilesForAllChannels: true,

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

	// Extra resources placed outside asar archive
	extraResources: [
		{
			from: "dist/resources/bin",
			to: "resources/bin",
			filter: ["**/*"],
		},
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

	// Deep linking protocol
	protocols: {
		name: productName,
		schemes: ["maestro"],
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
