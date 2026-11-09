/** 書き出しのファイル名（ADR-0044）。パスは Vault ルートからの相対（先頭に / を付けない。区切りは /） */

/** 書き出し先（ADR-0038） */
export const TMP_FOLDER = "tmp";

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
