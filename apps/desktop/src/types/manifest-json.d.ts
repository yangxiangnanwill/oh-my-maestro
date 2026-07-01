/**
 * Type declaration for resources/public/file-icons/manifest.json.
 * This JSON file is generated at build time from the Material-icon-theme mapping.
 * At dev time it's loaded via Vite's JSON import.
 */

declare module "resources/public/file-icons/manifest.json" {
	export interface FileIconManifestJson {
		fileNames: Record<string, string>;
		fileExtensions: Record<string, string>;
		folderNames: Record<string, string>;
		folderNamesExpanded: Record<string, string>;
		defaultIcon: string;
		defaultFolderIcon: string;
		defaultFolderOpenIcon: string;
	}

	const manifest: FileIconManifestJson;
	export default manifest;
}
