import type { PromiseFsClient } from "isomorphic-git";
import { normalizePath, type FileStore } from "./file-store";

/** isomorphic-git に渡す dir。FileStore 側でルート扱いになる */
export const GIT_DIR_ROOT = "/";

function fsError(code: string, path: string): Error {
	return Object.assign(new Error(`${code}: ${path}`), { code });
}

function toStats(stat: { type: "file" | "folder"; size: number; mtime: number; ctime: number }) {
	const isFile = stat.type === "file";
	return {
		type: isFile ? "file" : "dir",
		mode: isFile ? 0o100644 : 0o40000,
		size: isFile ? stat.size : 0,
		ino: 0,
		uid: 0,
		gid: 0,
		dev: 0,
		mtimeMs: stat.mtime,
		ctimeMs: stat.ctime || stat.mtime,
		isFile: () => isFile,
		isDirectory: () => !isFile,
		isSymbolicLink: () => false,
	};
}

/**
 * FileStore を isomorphic-git の fs インターフェースに変換する。
 * シンボリックリンクは Obsidian（特にモバイル）で扱えないため非対応。
 */
export function createGitFs(store: FileStore): PromiseFsClient {
	const promises = {
		async readFile(path: string, options?: { encoding?: string } | string) {
			const p = normalizePath(path);
			const stat = await store.stat(p);
			if (!stat || stat.type !== "file") throw fsError("ENOENT", p);
			const data = await store.read(p);
			const encoding = typeof options === "string" ? options : options?.encoding;
			return encoding === "utf8" ? new TextDecoder().decode(data) : data;
		},
		async writeFile(path: string, data: Uint8Array | string) {
			const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
			await store.write(normalizePath(path), bytes);
		},
		async unlink(path: string) {
			const p = normalizePath(path);
			const stat = await store.stat(p);
			if (!stat) throw fsError("ENOENT", p);
			await store.remove(p);
		},
		async readdir(path: string) {
			const p = normalizePath(path);
			const stat = await store.stat(p);
			if (p !== "" && !stat) throw fsError("ENOENT", p);
			if (stat && stat.type !== "folder") throw fsError("ENOTDIR", p);
			return store.list(p);
		},
		async mkdir(path: string) {
			const p = normalizePath(path);
			if (await store.stat(p)) throw fsError("EEXIST", p);
			await store.mkdir(p);
		},
		async rmdir(path: string) {
			const p = normalizePath(path);
			if (!(await store.stat(p))) throw fsError("ENOENT", p);
			if ((await store.list(p)).length > 0) throw fsError("ENOTEMPTY", p);
			await store.rmdir(p);
		},
		async stat(path: string) {
			const p = normalizePath(path);
			if (p === "") return toStats({ type: "folder", size: 0, mtime: 0, ctime: 0 });
			const stat = await store.stat(p);
			if (!stat) throw fsError("ENOENT", p);
			return toStats(stat);
		},
		async lstat(path: string) {
			return promises.stat(path);
		},
		async readlink(path: string): Promise<never> {
			throw fsError("ENOSYS", normalizePath(path));
		},
		async symlink(_target: string, path: string): Promise<never> {
			throw fsError("ENOSYS", normalizePath(path));
		},
		async chmod() {
			// 実行ビットは扱わない
		},
	};
	return { promises };
}
