/** その Vault のテンプレート（子のもの。同じ名前なら上流のテンプレートより優先する） */
export const TEMPLATE_DIR = "template/file";
/**
 * 上流（pkm-kit）のテンプレートと設定（ハーネスの ADR-0009）。隠しパスなので Vault の索引には載らない。
 * 設定は上流だけが正本で、子は上書きしない（ADR-0039）
 */
export const UPSTREAM_TEMPLATE_DIR = ".kit/templates/file";
export const UPSTREAM_TEMPLATE_CONFIG_PATH = ".kit/templates/config.json";

export interface TemplateEntry {
	/** テンプレートのファイル名（`template/file/` か `.kit/templates/file/` 直下。例: `"note.md"`） */
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

/** 上流の `.kit/templates/config.json` を読む */
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

const defaultEntry = (file: string): TemplateEntry => ({ file, enabled: true, folder: "", fileNamePattern: "" });

/**
 * 上流の設定（upstream）と、実在するテンプレート（files。上流と子の和）を合わせる。
 * 並び順は、上流の設定の順 → 残りのファイル名の順。上流の設定にないものは既定値。ファイルがないものは出さない
 */
export function resolveTemplateEntries(params: { upstream: readonly TemplateEntry[]; files: readonly string[] }): TemplateEntry[] {
	const actual = new Set(params.files.filter(isValidTemplateFileName));
	const listed = params.upstream.filter((e) => actual.has(e.file));
	const listedFiles = new Set(listed.map((e) => e.file));
	const rest = [...actual].filter((f) => !listedFiles.has(f)).sort((a, b) => a.localeCompare(b));
	return [...listed.map((e) => ({ ...e })), ...rest.map(defaultEntry)];
}
