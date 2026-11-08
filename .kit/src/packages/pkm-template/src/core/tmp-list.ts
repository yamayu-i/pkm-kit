/**
 * tmp/ の一覧 View（ADR-0045）の集め方・並べ替え・表示。Obsidian に依存しない
 */

/** 一時ファイルの置き場（ADR-0038） */
export const TMP_FOLDER = "tmp";

/** tmp/ の下のパスか（Vault ルートからのパス） */
export function isTmpPath(path: string): boolean {
	return path.startsWith(`${TMP_FOLDER}/`);
}

/** 一覧に出す 1 件（Obsidian の TFile から作る） */
export interface TmpEntry {
	/** Vault ルートからのパス */
	path: string;
	/** tmp/ からのパス（表示と絞り込みに使う） */
	name: string;
	/** 拡張子（小文字。なければ空） */
	ext: string;
	/** 更新日時（ミリ秒） */
	mtime: number;
	/** 大きさ（バイト） */
	size: number;
}

export interface FileLike {
	path: string;
	extension: string;
	stat: { mtime: number; size: number };
}

export function collectTmpEntries(files: readonly FileLike[]): TmpEntry[] {
	return files
		.filter((f) => isTmpPath(f.path))
		.map((f) => ({ path: f.path, name: f.path.slice(TMP_FOLDER.length + 1), ext: f.extension.toLowerCase(), mtime: f.stat.mtime, size: f.stat.size }));
}

/** name に、大文字小文字を区別せず部分一致するもの。空の検索語はそのまま返す */
export function filterTmpEntries(entries: readonly TmpEntry[], query: string): TmpEntry[] {
	const q = query.trim().toLowerCase();
	if (q === "") return [...entries];
	return entries.filter((e) => e.name.toLowerCase().includes(q));
}

export type TmpSortKey = "name" | "modified" | "size";
export type SortOrder = "asc" | "desc";

/** 並べ替えた新しい配列を返す。同じ値なら name の順 */
export function sortTmpEntries(entries: readonly TmpEntry[], key: TmpSortKey, order: SortOrder): TmpEntry[] {
	const sign = order === "asc" ? 1 : -1;
	return [...entries].sort((a, b) => {
		const byName = a.name.localeCompare(b.name);
		if (key === "name") return sign * byName;
		const d = key === "modified" ? a.mtime - b.mtime : a.size - b.size;
		return d !== 0 ? sign * d : byName;
	});
}

/** 1023 B / 1.0 KB / 12 KB / 1.5 MB / 2.0 GB */
export function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	const units = ["KB", "MB", "GB"];
	let value = bytes / 1024;
	let i = 0;
	while (value >= 1024 && i < units.length - 1) {
		value /= 1024;
		i++;
	}
	return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
}

/** 端末の時刻で `2026-11-08 09:05` */
export function formatModified(mtime: number): string {
	const d = new Date(mtime);
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Obsidian（と自作プラグイン）が開ける拡張子。ここにないものは、PC では OS の既定のアプリで開く。
 * Obsidian の標準（Markdown・Canvas・Bases・画像・音声・動画・PDF）と、pkm-html（html / htm）
 */
const OPENABLE = new Set(["md", "canvas", "base", "html", "htm", "avif", "bmp", "gif", "jpeg", "jpg", "png", "svg", "webp", "flac", "m4a", "mp3", "ogg", "wav", "3gp", "mkv", "mov", "mp4", "ogv", "webm", "pdf"]);

export function openableInObsidian(ext: string): boolean {
	return OPENABLE.has(ext.toLowerCase());
}
