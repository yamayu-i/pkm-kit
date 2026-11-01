import { basename, dirname } from "../fs/file-store";
import { isTargetPath, markUpdated, mergeUpdatedLine, unmarkUpdated, updatedLine } from "../stamp/updated";
import { mergeText, type ConflictLabels } from "./text-merge";

export interface TreeEntry {
	oid: string;
	mode: string;
}

/** マージ結果。既存 blob を指すか、新しく書く内容を持つ */
export type ResultEntry = { mode: string; oid: string } | { mode: string; content: Uint8Array };

export type ConflictKind =
	/** md/txt にコンフリクトマーカーを入れた */
	| "markers"
	/** リモート版を採用し、ローカル版を別名ファイルで残した */
	| "copy"
	/** 片方が削除・片方が編集。編集側を残した */
	| "kept-modified";

export interface MergeConflict {
	path: string;
	kind: ConflictKind;
	/** kind === "copy" のときのローカル版の保存先 */
	copyPath?: string;
}

export interface TreeMergeInput {
	base: Map<string, TreeEntry>;
	ours: Map<string, TreeEntry>;
	theirs: Map<string, TreeEntry>;
	readBlob(oid: string): Promise<Uint8Array>;
	labels: ConflictLabels;
	/** コンフリクト版ファイル名に入れる文字列（端末名と日時） */
	copySuffix: string;
}

export interface TreeMergeResult {
	entries: Map<string, ResultEntry>;
	conflicts: MergeConflict[];
}

/** コンフリクトマーカーを入れてよい拡張子。JSON などに入れると Obsidian の設定が壊れる */
const MARKER_EXTENSIONS = new Set(["md", "markdown", "txt"]);
const SUBMODULE_MODE = "160000";
const SYMLINK_MODE = "120000";

function extension(path: string): string {
	const name = basename(path);
	const i = name.lastIndexOf(".");
	return i <= 0 ? "" : name.slice(i + 1).toLowerCase();
}

function decodeText(data: Uint8Array): string | null {
	if (data.subarray(0, 8000).includes(0)) return null;
	try {
		return new TextDecoder("utf-8", { fatal: true }).decode(data);
	} catch {
		return null;
	}
}

function withUpdated(merged: { clean: boolean; text: string }, line: string | null): { clean: boolean; text: string } {
	return { clean: merged.clean, text: unmarkUpdated(merged.text, line) };
}

function sameEntry(a: TreeEntry | undefined, b: TreeEntry | undefined): boolean {
	if (!a || !b) return a === b;
	return a.oid === b.oid && a.mode === b.mode;
}

export function conflictCopyPath(path: string, suffix: string, taken: (p: string) => boolean): string {
	const dir = dirname(path);
	const name = basename(path);
	const dot = name.lastIndexOf(".");
	const stem = dot > 0 ? name.slice(0, dot) : name;
	const ext = dot > 0 ? name.slice(dot) : "";
	for (let n = 1; ; n++) {
		const candidate = `${stem} (conflict ${suffix}${n > 1 ? ` ${n}` : ""})${ext}`;
		const full = dir ? `${dir}/${candidate}` : candidate;
		if (!taken(full)) return full;
	}
}

/**
 * ファイル単位の 3-way マージ。どのケースでもデータを捨てない。
 * - 片側だけの変更 → その変更を採用
 * - 両側で変更 → 行単位でマージ。重なったら md/txt はマーカー、それ以外はリモート優先＋ローカル版を別名保存
 * - 削除 vs 編集 → 編集側を残す
 */
export async function mergeTrees(input: TreeMergeInput): Promise<TreeMergeResult> {
	const { base, ours, theirs } = input;
	const entries = new Map<string, ResultEntry>();
	const conflicts: MergeConflict[] = [];
	const copies: Array<{ path: string; entry: TreeEntry }> = [];
	const paths = [...new Set([...base.keys(), ...ours.keys(), ...theirs.keys()])].sort();

	for (const path of paths) {
		const b = base.get(path);
		const o = ours.get(path);
		const t = theirs.get(path);

		if (sameEntry(o, t)) {
			if (o) entries.set(path, o);
			continue;
		}
		if (sameEntry(o, b)) {
			if (t) entries.set(path, t);
			continue;
		}
		if (sameEntry(t, b)) {
			if (o) entries.set(path, o);
			continue;
		}

		// ここから両側で異なる変更
		if (!o || !t) {
			const kept = (o ?? t) as TreeEntry;
			entries.set(path, kept);
			conflicts.push({ path, kind: "kept-modified" });
			continue;
		}

		const special = [o.mode, t.mode].some((m) => m === SUBMODULE_MODE || m === SYMLINK_MODE);
		if (!special) {
			const [oursData, theirsData, baseData] = await Promise.all([
				input.readBlob(o.oid),
				input.readBlob(t.oid),
				b ? input.readBlob(b.oid) : Promise.resolve(new Uint8Array()),
			]);
			const oursText = decodeText(oursData);
			const theirsText = decodeText(theirsData);
			const baseText = decodeText(baseData);
			if (oursText !== null && theirsText !== null && baseText !== null) {
				// updated は両側で必ず変わるので衝突の対象から外し、新しい方を採る(ADR-0028)
				const merged = isTargetPath(path)
					? withUpdated(mergeText(markUpdated(baseText), markUpdated(oursText), markUpdated(theirsText), input.labels), mergeUpdatedLine(updatedLine(oursText), updatedLine(theirsText)))
					: mergeText(baseText, oursText, theirsText, input.labels);
				if (merged.clean || MARKER_EXTENSIONS.has(extension(path))) {
					entries.set(path, { mode: t.mode, content: new TextEncoder().encode(merged.text) });
					if (!merged.clean) conflicts.push({ path, kind: "markers" });
					continue;
				}
			}
		}

		// リモート優先。ローカル版は後で別名を決めて残す
		entries.set(path, t);
		copies.push({ path, entry: o });
	}

	for (const { path, entry } of copies) {
		const copyPath = conflictCopyPath(path, input.copySuffix, (p) => entries.has(p));
		entries.set(copyPath, entry);
		conflicts.push({ path, kind: "copy", copyPath });
	}

	assertNoFileDirCollision(entries);
	conflicts.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
	return { entries, conflicts };
}

/** 一方で `a` がファイル、もう一方で `a/b` がある、のような状態はツリーにできない */
function assertNoFileDirCollision(entries: Map<string, ResultEntry>): void {
	for (const path of entries.keys()) {
		for (let dir = dirname(path); dir !== ""; dir = dirname(dir)) {
			if (entries.has(dir)) {
				throw new Error(`マージできません: "${dir}" がファイルとフォルダの両方として存在します`);
			}
		}
	}
}
