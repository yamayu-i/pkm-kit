/**
 * 旧 ID（vault-*）の data.json の引き継ぎ（ADR-0058）。
 * data.json は端末ごとで git に入らないので、移行はほかの端末に届かない。
 * 自分の data.json がなく、旧 ID の data.json があれば、それを読んで自分の設定として保存する（古いファイルは消さない）。
 */

export interface LegacyDataDeps {
	loadData(): Promise<unknown>;
	saveData(data: unknown): Promise<void>;
	exists(path: string): Promise<boolean>;
	read(path: string): Promise<string>;
}

/** 旧 ID の data.json の場所（Vault ルートからのパス） */
export function legacyDataPath(configDir: string, legacyId: string): string {
	return `${configDir}/plugins/${legacyId}/data.json`;
}

export async function loadDataOrLegacy(deps: LegacyDataDeps, legacyPath: string): Promise<unknown> {
	const own = await deps.loadData();
	if (own !== null && own !== undefined) return own;
	try {
		if (!(await deps.exists(legacyPath))) return null;
		const data: unknown = JSON.parse(await deps.read(legacyPath));
		if (typeof data !== "object" || data === null || Array.isArray(data)) return null;
		await deps.saveData(data);
		return data;
	} catch {
		// 読めない旧 ID の設定は使わず、既定の設定で始める
		return null;
	}
}

/** Obsidian のプラグインから使う形 */
export function loadPluginDataOrLegacy(
	plugin: {
		loadData(): Promise<unknown>;
		saveData(data: unknown): Promise<void>;
		app: { vault: { configDir: string; adapter: { exists(path: string): Promise<boolean>; read(path: string): Promise<string> } } };
	},
	legacyId: string,
): Promise<unknown> {
	const { adapter, configDir } = plugin.app.vault;
	return loadDataOrLegacy(
		{
			loadData: () => plugin.loadData(),
			saveData: (data) => plugin.saveData(data),
			exists: (path) => adapter.exists(path),
			read: (path) => adapter.read(path),
		},
		legacyDataPath(configDir, legacyId),
	);
}
