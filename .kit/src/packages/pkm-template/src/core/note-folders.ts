/**
 * Notes の一覧の Folders（ADR-0213）: note/ のフォルダの木と、フォルダの操作の判定。
 * Obsidian の値は import しない（テストできるよう、純粋な関数だけを置く）
 */

/** 木にするフォルダ。テンプレートが新しいノートを作る場所（.kit/templates/config.json） */
export const NOTE_ROOT = "note";
/** git は空のフォルダを残さないので、作ったフォルダに置く */
export const KEEP_FILE = ".gitkeep";

/** Obsidian がファイル名に使えない文字と、リンクで意味を持つ文字 */
const BAD_CHARS = /[\\/:*?"<>|#^[\]]/;

export function baseName(path: string): string {
	return path.slice(path.lastIndexOf("/") + 1);
}

export function parentOf(path: string): string {
	const i = path.lastIndexOf("/");
	return i === -1 ? "" : path.slice(0, i);
}

/** a が b そのものか、b の下にあるか */
export function isWithin(a: string, b: string): boolean {
	return a === b || a.startsWith(`${b}/`);
}

function isHidden(path: string): boolean {
	return path.split("/").some((part) => part.startsWith("."));
}

/** Vault のフォルダのパスから、木にするフォルダ（note/ を含む）を名前の順に */
export function noteFolders(folders: readonly string[]): string[] {
	const set = new Set([NOTE_ROOT, ...folders.filter((f) => isWithin(f, NOTE_ROOT) && !isHidden(f))]);
	return [...set].sort((a, b) => a.localeCompare(b));
}

/** 木の 1 段: フォルダの直下にあるフォルダ（名前の順）とノートのパス（並べ替えは呼ぶ側） */
export function childrenOf(folders: readonly string[], notes: readonly string[], parent: string): { folders: string[]; notes: string[] } {
	const direct = (p: string) => p !== parent && parentOf(p) === parent;
	return { folders: folders.filter(direct).sort((a, b) => a.localeCompare(b)), notes: notes.filter(direct) };
}

/** フォルダの中（下の段も含む）のノートの数 */
export function countIn(notes: readonly string[], folder: string): number {
	return notes.filter((n) => isWithin(n, folder)).length;
}

/** note/ の外のノート（木の最後の「Other locations」に出す） */
export function outsideNotes(notes: readonly string[]): string[] {
	return notes.filter((n) => !isWithin(n, NOTE_ROOT));
}

/** 行に出すフォルダの位置。note/ の中は note/ から（直下は空）、外は Vault ルートから（ルートは /） */
export function locationOf(path: string): string {
	const parent = parentOf(path);
	if (isWithin(parent, NOTE_ROOT)) return parent === NOTE_ROOT ? "" : parent.slice(NOTE_ROOT.length + 1);
	return parent === "" ? "/" : parent;
}

export function folderNameError(name: string): string | null {
	if (name === "") return "名前を入れてください";
	if (BAD_CHARS.test(name)) return "名前に \\ / : * ? \" < > | # ^ [ ] は使えません";
	if (name.startsWith(".")) return "名前を . で始めると、隠しフォルダになります";
	return null;
}

type Target = { error: string } | { path: string };

/**
 * 動かせるか。動かすもの（ノートかフォルダ）を、行き先のフォルダ（note/ かその下）の直下に、同じ名前で置く。
 * 動かせなければ理由、動かせれば新しいパス
 */
export function moveTarget(folders: readonly string[], source: string, dest: string, exists: (path: string) => boolean): Target {
	if (source === NOTE_ROOT) return { error: "note/ そのものは動かせません" };
	if (!folders.includes(dest)) return { error: "行き先は note/ か、その下のフォルダにします" };
	if (isWithin(dest, source)) return { error: "フォルダを、そのフォルダ自身やその下には動かせません" };
	if (parentOf(source) === dest) return { error: "すでにそのフォルダにあります" };
	const path = `${dest}/${baseName(source)}`;
	if (exists(path)) return { error: `${path} がすでにあります` };
	return { path };
}

/** フォルダの名前を変えられるか。変えられれば新しいパス */
export function renameTarget(source: string, name: string, exists: (path: string) => boolean): Target {
	if (source === NOTE_ROOT) return { error: "note/ そのものの名前は変えられません" };
	const bad = folderNameError(name);
	if (bad !== null) return { error: bad };
	const path = `${parentOf(source)}/${name}`;
	if (path === source) return { error: "同じ名前です" };
	if (exists(path)) return { error: `${path} がすでにあります` };
	return { path };
}

/** 消せるか: 中（下の段も含む）に .gitkeep のほかのファイルがない。note/ そのものは消さない */
export function isDeletable(files: readonly string[], folder: string): boolean {
	if (folder === NOTE_ROOT) return false;
	return files.every((f) => !isWithin(f, folder) || baseName(f) === KEEP_FILE);
}
