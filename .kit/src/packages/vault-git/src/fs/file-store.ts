/**
 * Vault 相対パスで読み書きする最小限のファイル操作。
 * Obsidian 実装（vault-store.ts）とテスト用の Node 実装を差し替えられるようにする。
 * パスは先頭スラッシュなし・区切りは "/"・ルートは ""。
 */
export interface FileStat {
	type: "file" | "folder";
	size: number;
	mtime: number;
	ctime: number;
}

export interface FileStore {
	stat(path: string): Promise<FileStat | null>;
	read(path: string): Promise<Uint8Array>;
	/** 親フォルダがなければ作る */
	write(path: string, data: Uint8Array): Promise<void>;
	/** 直下のエントリ名（パスではなく名前）を返す */
	list(path: string): Promise<string[]>;
	mkdir(path: string): Promise<void>;
	remove(path: string): Promise<void>;
	rmdir(path: string): Promise<void>;
}

export function normalizePath(path: string): string {
	return path
		.split("/")
		.filter((s) => s !== "" && s !== ".")
		.join("/");
}

export function dirname(path: string): string {
	const i = path.lastIndexOf("/");
	return i < 0 ? "" : path.slice(0, i);
}

export function basename(path: string): string {
	return path.slice(path.lastIndexOf("/") + 1);
}
