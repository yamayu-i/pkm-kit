import type { App } from "obsidian";
import { dirname, type FileStat, type FileStore } from "../fs/file-store";

function isHidden(path: string): boolean {
	return path.split("/").some((seg) => seg.startsWith("."));
}

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
	return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

/**
 * Obsidian 上の FileStore。
 * - 通常のノートは Vault API 経由で書く（開いているエディタやキャッシュに反映させるため。モバイルでは特に必要）
 * - .git や .obsidian など隠しパスは Vault API の対象外なのでアダプタで直接扱う
 */
export class VaultFileStore implements FileStore {
	constructor(private readonly app: App) {}

	private get adapter() {
		return this.app.vault.adapter;
	}

	async stat(path: string): Promise<FileStat | null> {
		const s = await this.adapter.stat(path || "/");
		if (!s) return null;
		return { type: s.type, size: s.size, mtime: s.mtime, ctime: s.ctime };
	}

	async read(path: string): Promise<Uint8Array> {
		return new Uint8Array(await this.adapter.readBinary(path));
	}

	async write(path: string, data: Uint8Array): Promise<void> {
		await this.mkdir(dirname(path));
		if (isHidden(path)) {
			await this.adapter.writeBinary(path, toArrayBuffer(data));
			return;
		}
		const file = this.app.vault.getFileByPath(path);
		if (file) await this.app.vault.modifyBinary(file, toArrayBuffer(data));
		else await this.app.vault.createBinary(path, toArrayBuffer(data));
	}

	async list(path: string): Promise<string[]> {
		const { files, folders } = await this.adapter.list(path || "/");
		return [...files, ...folders].map((p) => p.slice(p.lastIndexOf("/") + 1));
	}

	async mkdir(path: string): Promise<void> {
		if (path === "" || (await this.adapter.exists(path))) return;
		await this.mkdir(dirname(path));
		if (isHidden(path)) await this.adapter.mkdir(path);
		else await this.app.vault.createFolder(path);
	}

	async remove(path: string): Promise<void> {
		const file = isHidden(path) ? null : this.app.vault.getFileByPath(path);
		if (file) await this.app.vault.delete(file, true);
		else await this.adapter.remove(path);
	}

	async rmdir(path: string): Promise<void> {
		const folder = isHidden(path) ? null : this.app.vault.getFolderByPath(path);
		if (folder) await this.app.vault.delete(folder, true);
		else await this.adapter.rmdir(path, false);
	}
}
