/** 図と書き出しのファイル名（ADR-0064）。パスは Vault ルートからの相対（先頭に / を付けない。区切りは /） */
import { DRAWIO_SVG_SUFFIX } from "./svg.ts";

/** 添付の置き場所（ノートの規約。サブフォルダを作らない） */
export const ASSET_FOLDER = "asset";
/** 書き出し先（ADR-0038） */
export const TMP_FOLDER = "tmp";

/** 新しい図の名前（拡張子なし）を検査する。問題があれば理由、なければ null */
export function invalidDiagramName(name: string): string | null {
	const trimmed = name.trim();
	if (trimmed === "") return "名前を入れてください";
	if (/[\\/:*?"<>|#^[\]\u0000-\u001f]/.test(trimmed)) return "使えない文字（/ \\ : * ? \" < > | # ^ [ ]）が入っています";
	if (trimmed.startsWith(".")) return "名前を . で始めないでください";
	if (trimmed.length > 100) return "名前が長すぎます（100 文字まで）";
	return null;
}

/** 名前（拡張子なし）から図のパス */
export function diagramPath(name: string): string {
	return `${ASSET_FOLDER}/${name.trim()}${DRAWIO_SVG_SUFFIX}`;
}

/** 図のパスから名前（拡張子なし） */
export function diagramName(path: string): string {
	const base = path.slice(path.lastIndexOf("/") + 1);
	return base.toLowerCase().endsWith(DRAWIO_SVG_SUFFIX) ? base.slice(0, -DRAWIO_SVG_SUFFIX.length) : base;
}

/** md のリンク先にする（Vault ルートからのパス。空白などはエンコードする） */
export function markdownImage(alt: string, path: string): string {
	const url = path.split("/").map((s) => encodeURIComponent(s)).join("/");
	return `![${alt.replace(/[[\]\\]/g, (c) => `\\${c}`)}](${url})`;
}

/** 使われていない名前を選ぶ: `<stem><ext>`、なければ `<stem> 2<ext>`、… */
export function freePath(folder: string, stem: string, ext: string, taken: (path: string) => boolean): string {
	for (let n = 1; ; n++) {
		const path = `${folder}/${stem}${n > 1 ? ` ${n}` : ""}${ext}`;
		if (!taken(path)) return path;
	}
}

/** 書き出し先: tmp/<ファイル名>。あれば番号を付ける */
export function exportPath(sourcePath: string, taken: (path: string) => boolean): string {
	const base = sourcePath.slice(sourcePath.lastIndexOf("/") + 1);
	const dot = base.lastIndexOf(".");
	return freePath(TMP_FOLDER, dot > 0 ? base.slice(0, dot) : base, dot > 0 ? base.slice(dot) : "", taken);
}

/** 保存がぶつかったときの別名: asset/<名前> (編集 YYYY-MM-DD HHmm).drawio.svg */
export function editedCopyPath(path: string, now: Date, taken: (path: string) => boolean): string {
	const pad = (n: number) => String(n).padStart(2, "0");
	const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}${pad(now.getMinutes())}`;
	const folder = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : ASSET_FOLDER;
	return freePath(folder, `${diagramName(path)} (編集 ${stamp})`, DRAWIO_SVG_SUFFIX, taken);
}
