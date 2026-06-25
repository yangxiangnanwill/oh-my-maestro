type PackagedNodeModuleCopy = {
	filter: string[];
	from: string;
	to: string;
};

type ExternalizedRuntimeModule = {
	asarUnpackGlobs: string[];
	materialize: string[];
	packagedCopies: PackagedNodeModuleCopy[];
	specifier: string;
};

function copyWholeModule(moduleName: string): PackagedNodeModuleCopy {
	return {
		from: `node_modules/${moduleName}`,
		to: `node_modules/${moduleName}`,
		filter: ["**/*"],
	};
}

const externalizedRuntimeModules: ExternalizedRuntimeModule[] = [
	{
		specifier: "better-sqlite3",
		materialize: ["better-sqlite3"],
		packagedCopies: [copyWholeModule("better-sqlite3")],
		asarUnpackGlobs: ["**/node_modules/better-sqlite3/**/*"],
	},
	{
		specifier: "node-pty",
		materialize: ["node-pty"],
		packagedCopies: [copyWholeModule("node-pty")],
		asarUnpackGlobs: ["**/node_modules/node-pty/**/*"],
	},
	{
		specifier: "native-keymap",
		materialize: ["native-keymap"],
		packagedCopies: [copyWholeModule("native-keymap")],
		asarUnpackGlobs: ["**/node_modules/native-keymap/**/*"],
	},
	{
		specifier: "@ast-grep/napi",
		materialize: ["@ast-grep/napi"],
		packagedCopies: [copyWholeModule("@ast-grep")],
		asarUnpackGlobs: ["**/node_modules/@ast-grep/napi*/**/*"],
	},
	{
		specifier: "@parcel/watcher",
		materialize: ["@parcel/watcher"],
		packagedCopies: [
			{
				from: "node_modules/@parcel",
				to: "node_modules/@parcel",
				filter: ["watcher/**/*", "watcher-*/**/*"],
			},
		],
		asarUnpackGlobs: ["**/node_modules/@parcel/watcher*/**/*"],
	},
];

const packagedSupportModules = [
	copyWholeModule("bindings"),
	copyWholeModule("file-uri-to-path"),
	copyWholeModule("detect-libc"),
	copyWholeModule("node-addon-api"),
];

export const mainExternalizedDependencies = [
	...externalizedRuntimeModules.map((module) => module.specifier),
];

export const packagedNodeModuleCopies = [
	...externalizedRuntimeModules.flatMap((module) => module.packagedCopies),
	...packagedSupportModules,
];

export const packagedAsarUnpackGlobs = [
	...externalizedRuntimeModules.flatMap((module) => module.asarUnpackGlobs),
	"**/node_modules/bindings/**/*",
	"**/node_modules/file-uri-to-path/**/*",
];

export const requiredMaterializedNodeModules = [
	...externalizedRuntimeModules.flatMap((module) => module.materialize),
	"bindings",
	"file-uri-to-path",
	"detect-libc",
	"node-addon-api",
];
