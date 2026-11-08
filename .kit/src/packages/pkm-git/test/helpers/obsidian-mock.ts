import { existsSync, promises as fsp, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * ビルド済み main.js を動かすための最小限の Obsidian API モック。
 * 実ディレクトリを Vault に見立て、どの API 経由で書かれたかを記録する。
 */
export function createObsidianMock(root: string, secrets: Record<string, string>) {
	const notices: string[] = [];
	const statusTexts: string[] = [];
	const vaultHandlers: Record<string, Array<(file: { path: string }, oldPath?: string) => void>> = {};
	const modals: string[] = [];
	const vaultWrites: string[] = [];
	const adapterWrites: string[] = [];
	const abs = (p: string) => join(root, p === "/" ? "" : p);

	class TAbstractFile {
		constructor(public path: string) {}
	}
	class TFile extends TAbstractFile {
		get extension() {
			const i = this.path.lastIndexOf(".");
			return i < 0 ? "" : this.path.slice(i + 1);
		}
	}
	class TFolder extends TAbstractFile {}

	const isHidden = (p: string) => p.split("/").some((s) => s.startsWith("."));
	const statOf = async (p: string) => {
		try {
			return await fsp.stat(abs(p));
		} catch {
			return null;
		}
	};

	const adapter = {
		async stat(p: string) {
			const s = await statOf(p);
			return s ? { type: s.isDirectory() ? "folder" : "file", size: s.size, mtime: s.mtimeMs, ctime: s.ctimeMs } : null;
		},
		async exists(p: string) {
			return (await statOf(p)) !== null;
		},
		async readBinary(p: string) {
			const b = await fsp.readFile(abs(p));
			return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
		},
		async writeBinary(p: string, data: ArrayBuffer) {
			adapterWrites.push(p);
			await fsp.writeFile(abs(p), new Uint8Array(data));
		},
		async list(p: string) {
			const base = p === "/" ? "" : p;
			const files: string[] = [];
			const folders: string[] = [];
			for (const e of await fsp.readdir(abs(p), { withFileTypes: true })) {
				const full = base ? `${base}/${e.name}` : e.name;
				(e.isDirectory() ? folders : files).push(full);
			}
			return { files, folders };
		},
		async mkdir(p: string) {
			await fsp.mkdir(abs(p), { recursive: true });
		},
		async remove(p: string) {
			await fsp.rm(abs(p));
		},
		async rmdir(p: string) {
			await fsp.rmdir(abs(p));
		},
	};

	const listAll = (dir: string): string[] => {
		const out: string[] = [];
		for (const e of readdirSync(abs(dir), { withFileTypes: true })) {
			const full = dir ? `${dir}/${e.name}` : e.name;
			if (e.name.startsWith(".")) continue;
			if (e.isDirectory()) out.push(...listAll(full));
			else out.push(full);
		}
		return out;
	};

	const vault = {
		adapter,
		getFileByPath(p: string) {
			// 本物の Vault も隠しファイルは管理しない
			if (isHidden(p) || !existsSync(abs(p)) || statSync(abs(p)).isDirectory()) return null;
			return new TFile(p);
		},
		getFolderByPath(p: string) {
			if (isHidden(p) || !existsSync(abs(p)) || !statSync(abs(p)).isDirectory()) return null;
			return new TFolder(p);
		},
		async modifyBinary(f: TFile, data: ArrayBuffer) {
			vaultWrites.push(f.path);
			await fsp.writeFile(abs(f.path), new Uint8Array(data));
		},
		async createBinary(p: string, data: ArrayBuffer) {
			if (await statOf(p)) throw new Error("File already exists");
			vaultWrites.push(p);
			await fsp.writeFile(abs(p), new Uint8Array(data));
			return new TFile(p);
		},
		async createFolder(p: string) {
			await fsp.mkdir(abs(p));
		},
		async delete(f: TAbstractFile) {
			await fsp.rm(abs(f.path), { recursive: true });
		},
		getFiles() {
			return listAll("").map((p) => new TFile(p));
		},
		async cachedRead(f: TFile) {
			return fsp.readFile(abs(f.path), "utf8");
		},
		on(name: string, cb: (file: { path: string }, oldPath?: string) => void) {
			(vaultHandlers[name] ??= []).push(cb);
			return { name };
		},
	};
	/** Vault のイベントを起こす（本物の Vault は、ノートを書くとこれを呼ぶ） */
	const emit = (name: string, path: string, oldPath?: string) => {
		for (const cb of vaultHandlers[name] ?? []) cb(new TFile(path), oldPath);
	};

	const app = {
		vault,
		workspace: {
			getLeavesOfType: () => [],
			onLayoutReady: (cb: () => void) => cb(),
			openLinkText: async () => {},
		},
		secretStorage: { getSecret: (id: string) => secrets[id] ?? null },
	};

	const el = () => ({ setText() {}, addClass() {}, addEventListener() {}, empty() {}, createEl: () => el(), appendText() {} });
	const statusEl = () => ({ ...el(), setText(t: string) { statusTexts.push(t); } });

	class Plugin {
		app = app;
		data: unknown = null;
		commands: Record<string, () => void> = {};
		async loadData() {
			return this.data;
		}
		async saveData(d: unknown) {
			this.data = d;
		}
		addSettingTab() {}
		addStatusBarItem() {
			return statusEl();
		}
		manifest = { version: "0.0.0-test" };
		registerEvent() {}
		registerInterval(id: number) {
			return id;
		}
		registerDomEvent() {}
		addRibbonIcon() {}
		addCommand(c: { id: string; callback: () => void }) {
			this.commands[c.id] = c.callback;
		}
	}
	class Modal {
		contentEl = el();
		constructor(public app: unknown) {}
		setTitle(t: string) {
			modals.push(t);
			return this;
		}
		open() {
			(this as unknown as { onOpen(): void }).onOpen();
		}
		close() {}
	}
	class Setting {
		constructor(_el: unknown) {}
		setName() {
			return this;
		}
		setDesc() {
			return this;
		}
		setHeading() {
			return this;
		}
		addText() {
			return this;
		}
		addButton(cb: (b: unknown) => void) {
			const b = { setButtonText: () => b, setCta: () => b, onClick: () => b };
			cb(b);
			return this;
		}
		addComponent() {
			return this;
		}
	}

	const obsidian = {
		Plugin,
		Modal,
		Setting,
		PluginSettingTab: class {},
		SecretComponent: class {},
		MarkdownView: class {},
		Notice: class {
			constructor(msg: string) {
				notices.push(msg);
			}
		},
		Platform: { isIosApp: true, isAndroidApp: false, isMacOS: false, isWin: false },
		requestUrl: async (req: { url: string; method: string; headers: Record<string, string>; body?: ArrayBuffer }) => {
			const res = await fetch(req.url, { method: req.method, headers: req.headers, body: req.body });
			const headers: Record<string, string> = {};
			res.headers.forEach((v, k) => {
				headers[k] = v;
			});
			return { status: res.status, headers, arrayBuffer: await res.arrayBuffer() };
		},
	};

	return { obsidian, app, vault, notices, modals, vaultWrites, adapterWrites, statusTexts, emit };
}
