import { promises as fsp } from "node:fs";
import { join } from "node:path";
import type { FileStat, FileStore } from "../../src/fs/file-store";

/** テスト用: 実ディレクトリを Vault に見立てる */
export class NodeFileStore implements FileStore {
	constructor(readonly root: string) {}

	private abs(path: string): string {
		return join(this.root, path);
	}

	async stat(path: string): Promise<FileStat | null> {
		try {
			const s = await fsp.stat(this.abs(path));
			return { type: s.isDirectory() ? "folder" : "file", size: s.size, mtime: s.mtimeMs, ctime: s.ctimeMs };
		} catch {
			return null;
		}
	}

	async read(path: string): Promise<Uint8Array> {
		return new Uint8Array(await fsp.readFile(this.abs(path)));
	}

	async write(path: string, data: Uint8Array): Promise<void> {
		const abs = this.abs(path);
		await fsp.mkdir(join(abs, ".."), { recursive: true });
		await fsp.writeFile(abs, data);
	}

	async list(path: string): Promise<string[]> {
		return fsp.readdir(this.abs(path));
	}

	async mkdir(path: string): Promise<void> {
		await fsp.mkdir(this.abs(path), { recursive: true });
	}

	async remove(path: string): Promise<void> {
		await fsp.rm(this.abs(path));
	}

	async rmdir(path: string): Promise<void> {
		await fsp.rmdir(this.abs(path));
	}
}
