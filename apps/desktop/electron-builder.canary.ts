/**
 * Electron Builder Configuration — Canary Channel
 * Same as electron-builder.ts but with canary-specific settings.
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
const productName = `${pkg.productName} Canary`;
const winIconPath = join(pkg.resources, "build/icons/icon.ico");

const config: Configuration = {
	appId: "com.maestro-flow.desktop.canary",
	productName,
	copyright: `Copyright © ${currentYear} — ${author}`,
	electronVersion: pkg.devDependencies.electron.replace(/^\^/, ""),

	generateUpdatesFilesForAllChannels: true,

	publish: {
		provider: "github",
		owner: "yangxiangnanwill",
		repo: "oh-my-maestro",
	},

	directories: {
		output: "release",
		buildResources: join(pkg.resources, "build"),
	},

	asar: true,
	asarUnpack: [...packagedAsarUnpackGlobs],

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

	npmRebuild: true,

	protocols: {
		name: productName,
		schemes: ["maestro-canary"],
	},

	win: {
		...(existsSync(winIconPath) ? { icon: winIconPath } : {}),
		target: [{ target: "nsis", arch: ["x64"] }],
		artifactName: `${productName}-\${version}-\${arch}.\${ext}`,
	},

	nsis: {
		oneClick: false,
		allowToChangeInstallationDirectory: true,
	},
};

export default config;
