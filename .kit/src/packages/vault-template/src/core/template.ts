import { formatDateTime } from "./date-format";

export interface PromptField {
	label: string;
	defaultValue: string;
}

export interface RenderContext {
	now: Date;
	title: string;
	path: string;
	folder: string;
	prompts: Record<string, string>;
}

export interface RenderResult {
	content: string;
	cursorOffset: number | null;
}

export interface ResolvePathInput {
	folder: string;
	fileNamePattern: string;
	titleInput: string;
	now: Date;
	prompts: Record<string, string>;
}

export interface ResolvedOutputPath {
	path: string;
	folder: string;
	fileName: string;
	title: string;
	error: string | null;
}

const PLACEHOLDER_RE = /\{\{([^{}\n]+)\}\}/g;

function parsePromptSpec(body: string): PromptField | null {
	if (!body.startsWith("prompt:")) return null;
	const rest = body.slice("prompt:".length);
	const colon = rest.indexOf(":");
	const label = (colon === -1 ? rest : rest.slice(0, colon)).trim();
	const defaultValue = colon === -1 ? "" : rest.slice(colon + 1);
	if (!label) return null;
	return { label, defaultValue };
}

/** テンプレート内の `{{prompt:ラベル[:既定値]}}` を出現順に重複なく取り出す */
export function extractPrompts(template: string): PromptField[] {
	const seen = new Set<string>();
	const fields: PromptField[] = [];
	for (const match of template.matchAll(PLACEHOLDER_RE)) {
		const spec = parsePromptSpec((match[1] ?? "").trim());
		if (!spec || seen.has(spec.label)) continue;
		seen.add(spec.label);
		fields.push(spec);
	}
	return fields;
}

function expandInlineToken(token: string, ctx: RenderContext): string | null {
	if (token === "date") return formatDateTime(ctx.now, "YYYY-MM-DD");
	if (token.startsWith("date:")) return formatDateTime(ctx.now, token.slice("date:".length) || "YYYY-MM-DD");
	if (token === "time") return formatDateTime(ctx.now, "HH:mm");
	if (token.startsWith("time:")) return formatDateTime(ctx.now, token.slice("time:".length) || "HH:mm");
	if (token === "title") return ctx.title;
	if (token === "path") return ctx.path;
	if (token === "folder") return ctx.folder;
	const prompt = parsePromptSpec(token);
	if (prompt) {
		const val = ctx.prompts[prompt.label];
		return val !== undefined && val !== "" ? val : prompt.defaultValue;
	}
	return null;
}

/**
 * テンプレート文字列を展開し、最初の `{{cursor}}` の文字位置を返す。
 * `{{cursor}}` 自体は出力から取り除く。未知の `{{...}}` はそのまま残す。
 */
export function renderTemplate(template: string, ctx: RenderContext): RenderResult {
	let out = "";
	let cursorOffset: number | null = null;
	let lastIndex = 0;

	for (const match of template.matchAll(PLACEHOLDER_RE)) {
		const index = match.index ?? 0;
		const full = match[0];
		const token = (match[1] ?? "").trim();
		out += template.slice(lastIndex, index);
		lastIndex = index + full.length;

		if (token === "cursor") {
			if (cursorOffset === null) cursorOffset = out.length;
			continue;
		}
		const expanded = expandInlineToken(token, ctx);
		out += expanded !== null ? expanded : full;
	}
	out += template.slice(lastIndex);
	return { content: out, cursorOffset };
}

function expandPathPattern(pattern: string, now: Date, title: string, prompts: Record<string, string>): string {
	return pattern.replace(PLACEHOLDER_RE, (full, raw: string) => {
		const token = raw.trim();
		const expanded = expandInlineToken(token, { now, title, path: "", folder: "", prompts });
		return expanded !== null ? expanded : full;
	});
}

function validateSegments(segments: string[]): string | null {
	for (const seg of segments) {
		if (!seg || seg === ".") return "パスに空の階層があります";
		if (seg === "..") return "パスに .. は使えません";
		if (seg.startsWith(".")) return `隠しフォルダ・隠しファイル（${seg}）には作成できません`;
		if (/[\\:*?"<>|]/.test(seg)) return `ファイル名に使えない文字が含まれています: ${seg}`;
	}
	return null;
}

/**
 * 設定された `folder`・`fileNamePattern` とモーダルで入力された `titleInput` から、
 * 生成先パスと `{{title}}` の値を決定し、安全性を検査する。
 */
export function resolveOutputPath(input: ResolvePathInput): ResolvedOutputPath {
	const rawNameInput = input.titleInput.trim();
	const rawBaseName = rawNameInput || expandPathPattern(input.fileNamePattern.trim(), input.now, "", input.prompts).trim();
	if (!rawBaseName) {
		return { path: "", folder: "", fileName: "", title: "", error: "ファイル名を入力してください" };
	}

	const prelimTitle = (rawBaseName.split("/").pop() ?? rawBaseName).replace(/\.md$/i, "").trim();
	const expandedName = expandPathPattern(rawBaseName, input.now, prelimTitle, input.prompts).trim();
	const expandedFolder = expandPathPattern(input.folder.trim(), input.now, prelimTitle, input.prompts)
		.trim()
		.replace(/^\/+|\/+$/g, "");

	if (expandedName.startsWith("/") || input.folder.trim().startsWith("/")) {
		return { path: "", folder: "", fileName: "", title: "", error: "パスの先頭に / は付けられません" };
	}

	const combined = expandedFolder ? `${expandedFolder}/${expandedName}` : expandedName;
	const rawSegments = combined.split("/");
	const lastSeg = rawSegments.pop() ?? "";
	const title = lastSeg.replace(/\.md$/i, "").trim();
	if (!title) {
		return { path: "", folder: "", fileName: "", title: "", error: "ファイル名を入力してください" };
	}
	const fileName = `${title}.md`;
	const allSegments = [...rawSegments, fileName];
	const error = validateSegments(allSegments);
	if (error) {
		return { path: "", folder: "", fileName: "", title: "", error };
	}

	const folder = rawSegments.join("/");
	const path = allSegments.join("/");
	return { path, folder, fileName, title, error: null };
}

/** 文字オフセットをエディタの行・列（0 始まり）に変換する */
export function offsetToPos(text: string, offset: number): { line: number; ch: number } {
	const clamped = Math.max(0, Math.min(offset, text.length));
	const lines = text.slice(0, clamped).split("\n");
	return {
		line: lines.length - 1,
		ch: (lines.at(-1) ?? "").length,
	};
}
