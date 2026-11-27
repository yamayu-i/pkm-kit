/**
 * @file と /file（ADR-0249）。ローカルのファイルを asset/ に置くときの名前と、入れる Markdown。Obsidian には依存しない
 */
import { markdownLink } from "../../../shared/src/link-query.ts";

export const ASSET_FOLDER = "asset";

/** 1 ファイルの上限（20MB）。asset/ は git で同期し、履歴に残り続けるため */
export const MAX_ATTACH_BYTES = 20 * 1024 * 1024;

export type AttachMode = "link" | "embed";

/** Obsidian が埋め込みで表示できる拡張子 */
const EMBEDDABLE = new Set([
	"png", "jpg", "jpeg", "gif", "bmp", "svg", "webp", "avif",
	"pdf",
	"mp3", "wav", "m4a", "flac", "ogg", "oga", "opus", "3gp",
	"mp4", "webm", "ogv", "mov", "mkv",
]);

function splitExt(name: string): { stem: string; ext: string } {
	const dot = name.lastIndexOf(".");
	if (dot <= 0) return { stem: name, ext: "" };
	return { stem: name.slice(0, dot), ext: name.slice(dot + 1) };
}

function clean(s: string): string {
	return s
		.replace(/[\s\\/:*?"<>|#^[\]()%]+/g, "-")
		.replace(/-{2,}/g, "-")
		.replace(/^[-.]+|[-.]+$/g, "");
}

/** 空白と使えない文字をハイフンにし、先頭・末尾の点を除き、asset/ にある名前（taken）と重ならないよう -N を付ける */
export function assetFileName(original: string, taken: readonly string[]): string {
	// 先頭の点を外す（`..` や隠しファイルにしない）
	const { stem, ext } = splitExt(original.trim().replace(/^\.+/, ""));
	const base = clean(stem) || "file";
	const e = clean(ext).toLowerCase();
	const used = new Set(taken.map((t) => t.toLowerCase()));
	const make = (n: number) => `${base}${n > 0 ? `-${n}` : ""}${e ? `.${e}` : ""}`;
	let n = 0;
	while (used.has(make(n).toLowerCase())) n++;
	return make(n);
}

export function isEmbeddable(name: string): boolean {
	const { ext } = splitExt(name);
	return EMBEDDABLE.has(ext.toLowerCase());
}

/** link: `[名前.拡張子](path)`。embed: プレビューできるなら `![名前](path)`、できなければ link と同じ */
export function attachmentMarkdown(path: string, mode: AttachMode): string {
	const name = path.split("/").pop() ?? path;
	if (mode === "embed" && isEmbeddable(name)) return `!${markdownLink(splitExt(name).stem, path)}`;
	return markdownLink(name, path);
}

/** /file は 1 行に 1 つ、@file は半角空白で区切る */
export function joinAttachments(parts: readonly string[], mode: AttachMode): string {
	return parts.join(mode === "embed" ? "\n" : " ");
}
