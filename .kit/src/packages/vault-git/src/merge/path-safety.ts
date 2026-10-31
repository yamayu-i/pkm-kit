/**
 * リモートのツリーから来たパスを作業ツリーに書く前の検査。
 * Vault の外や .git の中に書き込まれるのを防ぐ（多重防御）。
 */
export function isSafeWorktreePath(path: string): boolean {
	if (path === "" || path.startsWith("/") || path.includes("\\") || path.includes("\0")) return false;
	if (/^[a-zA-Z]:/.test(path)) return false;
	return path.split("/").every((seg) => seg !== "" && seg !== "." && seg !== ".." && seg.toLowerCase() !== ".git");
}

export function assertSafeWorktreePath(path: string): void {
	if (!isSafeWorktreePath(path)) throw new Error(`unsafe path in tree: ${JSON.stringify(path)}`);
}
