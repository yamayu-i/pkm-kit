export const TEMPLATE_DIR = "template/file";
export const TEMPLATE_CONFIG_PATH = "template/config.json";

export interface TemplateEntry {
	/** `template/file/` 直下のファイル名（例: `"note.md"`） */
	file: string;
	/** 新規ファイル作成モーダルの一覧に出すか */
	enabled: boolean;
	/** 生成先フォルダ（Vault ルートからの相対パス。`daily/{{date:YYYY}}/{{date:MM}}` などの変数展開可） */
	folder: string;
	/** ファイル名（`.md` を除く）の初期値パターン（空なら入力したタイトルをファイル名にする） */
	fileNamePattern: string;
}

function isValidTemplateFileName(file: string): boolean {
	return Boolean(file) && file.endsWith(".md") && !file.includes("/") && !file.includes("\\") && !file.startsWith(".");
}

/** `template/config.json` を読む */
export function parseTemplateConfig(text: string): { templates: TemplateEntry[]; problems: string[] } {
	const problems: string[] = [];
	let data: unknown;
	try {
		data = JSON.parse(text);
	} catch {
		return { templates: [], problems: ["JSON として読めません"] };
	}
	const obj = typeof data === "object" && data !== null && !Array.isArray(data) ? (data as Record<string, unknown>) : null;
	if (!obj || !Array.isArray(obj.templates)) {
		return { templates: [], problems: ["templates 配列がありません"] };
	}

	const templates: TemplateEntry[] = [];
	const seen = new Set<string>();
	for (const raw of obj.templates) {
		const item = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
		const file = typeof item.file === "string" ? item.file.trim() : "";
		if (!isValidTemplateFileName(file)) {
			problems.push(`不正なテンプレートファイル名です: ${JSON.stringify(raw)}`);
			continue;
		}
		if (seen.has(file)) {
			problems.push(`テンプレート設定が重複しています: ${file}`);
			continue;
		}
		seen.add(file);
		templates.push({
			file,
			enabled: typeof item.enabled === "boolean" ? item.enabled : true,
			folder: typeof item.folder === "string" ? item.folder.trim().replace(/^\/+|\/+$/g, "") : "",
			fileNamePattern: typeof item.fileNamePattern === "string" ? item.fileNamePattern.trim() : "",
		});
	}
	return { templates, problems };
}

export function serializeTemplateConfig(templates: readonly TemplateEntry[]): string {
	const clean = templates.map((t) => ({
		file: t.file,
		enabled: t.enabled,
		folder: t.folder.trim().replace(/^\/+|\/+$/g, ""),
		fileNamePattern: t.fileNamePattern.trim(),
	}));
	return `${JSON.stringify({ templates: clean }, null, 2)}\n`;
}

/**
 * 設定ファイルの配列順を保ちつつ、`template/file/` に実在する `.md` ファイルと突き合わせる。
 * 設定にまだ載っていないファイルは末尾に既定値（`enabled: true`）で補完する。
 */
export function mergeTemplateEntries(
	configured: readonly TemplateEntry[],
	actualFiles: readonly string[],
): TemplateEntry[] {
	const actualSet = new Set(actualFiles.filter(isValidTemplateFileName));
	const result: TemplateEntry[] = [];
	const included = new Set<string>();

	for (const entry of configured) {
		if (!actualSet.has(entry.file) || included.has(entry.file)) continue;
		included.add(entry.file);
		result.push({ ...entry });
	}

	const remaining = [...actualSet].filter((f) => !included.has(f)).sort((a, b) => a.localeCompare(b));
	for (const file of remaining) {
		result.push({
			file,
			enabled: true,
			folder: "",
			fileNamePattern: "",
		});
	}
	return result;
}

/** 指定したテンプレートの表示順を前後に 1 つ移動する */
export function moveTemplateEntry(
	entries: readonly TemplateEntry[],
	file: string,
	delta: -1 | 1,
): TemplateEntry[] {
	const idx = entries.findIndex((e) => e.file === file);
	const targetIdx = idx + delta;
	if (idx === -1 || targetIdx < 0 || targetIdx >= entries.length) return [...entries];
	const next = [...entries];
	const current = next[idx]!;
	next[idx] = next[targetIdx]!;
	next[targetIdx] = current;
	return next;
}
