/** その Vault のテンプレートと設定（子のもの。上流の既定を上書きする） */
export const TEMPLATE_DIR = "template/file";
export const TEMPLATE_CONFIG_PATH = "template/config.json";
/** 上流（pkm-kit）の既定のテンプレートと設定（ハーネスの ADR-0009）。隠しパスなので Vault の索引には載らない */
export const UPSTREAM_TEMPLATE_DIR = ".kit/templates/file";
export const UPSTREAM_TEMPLATE_CONFIG_PATH = ".kit/templates/config.json";

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

/** 子の設定の 1 件。書いた項目だけが上流の値を上書きする */
export type TemplateOverride = { file: string } & Partial<Omit<TemplateEntry, "file">>;

/** 子の `template/config.json` を、上書き（書いた項目だけ）として読む。今までの完全な形の設定もそのまま読める */
export function parseTemplateOverrides(text: string): { overrides: TemplateOverride[]; problems: string[] } {
	const problems: string[] = [];
	let data: unknown;
	try {
		data = JSON.parse(text);
	} catch {
		return { overrides: [], problems: ["JSON として読めません"] };
	}
	const obj = typeof data === "object" && data !== null && !Array.isArray(data) ? (data as Record<string, unknown>) : null;
	if (!obj || !Array.isArray(obj.templates)) return { overrides: [], problems: ["templates 配列がありません"] };

	const overrides: TemplateOverride[] = [];
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
		const o: TemplateOverride = { file };
		if ("enabled" in item) {
			if (typeof item.enabled === "boolean") o.enabled = item.enabled;
			else problems.push(`${file}: enabled は true か false にします`);
		}
		for (const key of ["folder", "fileNamePattern"] as const) {
			if (!(key in item)) continue;
			const v = item[key];
			if (typeof v === "string") o[key] = key === "folder" ? v.trim().replace(/^\/+|\/+$/g, "") : v.trim();
			else problems.push(`${file}: ${key} は文字列にします`);
		}
		overrides.push(o);
	}
	return { overrides, problems };
}

export function serializeTemplateOverrides(overrides: readonly TemplateOverride[]): string {
	return `${JSON.stringify({ templates: overrides }, null, 2)}\n`;
}

const defaultEntry = (file: string): TemplateEntry => ({ file, enabled: true, folder: "", fileNamePattern: "" });

/**
 * 上流の既定（upstream）に、子の上書き（overrides）を項目ごとに重ねる。files は実在するテンプレート（上流と子の和）。
 * 並び順は、上書きに並べた順 → 上流の設定の順 → 残りのファイル名の順。ファイルがないものは出さない
 */
export function layerTemplateEntries(params: {
	upstream: readonly TemplateEntry[];
	overrides: readonly TemplateOverride[];
	files: readonly string[];
}): TemplateEntry[] {
	const actual = new Set(params.files.filter(isValidTemplateFileName));
	const base = new Map(params.upstream.map((e) => [e.file, e]));
	const over = new Map(params.overrides.map((o) => [o.file, o]));
	const order: string[] = [];
	const push = (file: string) => {
		if (actual.has(file) && !order.includes(file)) order.push(file);
	};
	for (const o of params.overrides) push(o.file);
	for (const e of params.upstream) push(e.file);
	for (const f of [...actual].sort((a, b) => a.localeCompare(b))) push(f);
	return order.map((file) => {
		const { file: _f, ...fields } = over.get(file) ?? { file };
		return { ...(base.get(file) ?? defaultEntry(file)), ...fields, file };
	});
}

/** 編集した一覧を、上流と違う項目だけの上書きにする。並び順を保つため、ファイル名はすべて書く */
export function diffTemplateEntries(entries: readonly TemplateEntry[], upstream: readonly TemplateEntry[]): TemplateOverride[] {
	const base = new Map(upstream.map((e) => [e.file, e]));
	return entries.map((e) => {
		const b = base.get(e.file) ?? defaultEntry(e.file);
		const o: TemplateOverride = { file: e.file };
		if (e.enabled !== b.enabled) o.enabled = e.enabled;
		if (e.folder !== b.folder) o.folder = e.folder;
		if (e.fileNamePattern !== b.fileNamePattern) o.fileNamePattern = e.fileNamePattern;
		return o;
	});
}
