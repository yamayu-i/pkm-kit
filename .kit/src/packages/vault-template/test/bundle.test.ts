import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const bundlePath = fileURLToPath(new URL("../../../../.obsidian/plugins/vault-template/main.js", import.meta.url));

interface MockFile {
	path: string;
	basename: string;
	extension: string;
}

function createObsidianMock(initialFiles: Record<string, string> = {}) {
	const files = new Map<string, string>(Object.entries(initialFiles));
	const folders = new Set<string>(["template", "template/file"]);
	const commands: { id: string; name: string; callback?: () => void }[] = [];
	const notices: string[] = [];
	let cursorPos: { line: number; ch: number } | null = null;
	let openedPath: string | null = null;

	const toTFile = (path: string): MockFile => {
		const name = path.split("/").pop() ?? path;
		const dot = name.lastIndexOf(".");
		return {
			path,
			basename: dot === -1 ? name : name.slice(0, dot),
			extension: dot === -1 ? "" : name.slice(dot + 1),
		};
	};

	const vault = {
		getFiles: () => [...files.keys()].map(toTFile),
		getFileByPath: (path: string) => (files.has(path) ? toTFile(path) : null),
		getFolderByPath: (path: string) => (folders.has(path) ? { path } : null),
		createFolder: async (path: string) => {
			folders.add(path);
		},
		read: async (file: MockFile) => files.get(file.path) ?? "",
		cachedRead: async (file: MockFile) => files.get(file.path) ?? "",
		create: async (path: string, content: string) => {
			if (files.has(path)) throw new Error(`File already exists: ${path}`);
			files.set(path, content);
			return toTFile(path);
		},
		modify: async (file: MockFile, content: string) => {
			files.set(file.path, content);
		},
	};

	const editor = {
		setCursor: (pos: { line: number; ch: number }) => {
			cursorPos = pos;
		},
		focus: () => {},
	};

	const leaf = {
		openFile: async (file: MockFile) => {
			openedPath = file.path;
		},
		view: { editor },
	};

	class Plugin {
		app = {
			vault,
			workspace: {
				getLeaf: () => leaf,
				getActiveViewOfType: () => ({ editor }),
			},
		};
		addCommand(c: { id: string; name: string; callback?: () => void }) {
			commands.push(c);
		}
		addRibbonIcon() {}
		addSettingTab() {}
	}

	class Modal {
		contentEl = {};
		constructor(readonly app: unknown) {}
		setTitle() {}
		open() {}
		close() {}
	}

	return {
		obsidian: {
			Plugin,
			Modal,
			PluginSettingTab: class {},
			Setting: class {},
			MarkdownView: class {},
			Notice: class {
				constructor(msg: string) {
					notices.push(msg);
				}
			},
			Platform: { isMobile: false },
			TFile: class {},
			normalizePath: (p: string) => p.replace(/^\/+|\/+$/g, ""),
			setIcon: () => {},
		},
		files,
		folders,
		commands,
		notices,
		getOpenedPath: () => openedPath,
		getCursorPos: () => cursorPos,
	};
}

describe.skipIf(!existsSync(bundlePath))("ビルド済み main.js", () => {
	it("obsidian 以外を require せず、onload でコマンドを登録してテンプレートからノートを作成できる", async () => {
		const mock = createObsidianMock({
			"template/file/note.md": [
				"---",
				"type: note",
				'created: "{{date:YYYY-MM-DDTHH:mm:ssZ}}"',
				'topic: "{{prompt:トピック:一般}}"',
				"---",
				"",
				"# {{title}}",
				"",
				"{{cursor}}本文",
			].join("\n"),
			"template/config.json": JSON.stringify({
				templates: [{ file: "note.md", enabled: true, folder: "notes/{{date:YYYY}}", fileNamePattern: "" }],
			}),
		});

		const required = new Set<string>();
		const req = (name: string) => {
			required.add(name);
			if (name === "obsidian") return mock.obsidian;
			throw new Error(`unexpected require: ${name}`);
		};

		const module = {
			exports: {} as {
				default: new () => {
					onload(): Promise<void>;
					manager: {
						loadConfig(): Promise<{ entries: { file: string; folder: string }[]; problems: string[] }>;
						saveConfig(entries: unknown[]): Promise<void>;
						loadEnabledTemplates(): Promise<unknown[]>;
						createNoteFromTemplate(opts: {
							template: unknown;
							titleInput: string;
							prompts: Record<string, string>;
							now: Date;
						}): Promise<{ path: string }>;
					};
				};
			},
		};
		new Function("module", "exports", "require", readFileSync(bundlePath, "utf8"))(module, module.exports, req);

		const plugin = new module.exports.default();
		await plugin.onload();

		expect([...required]).toEqual(["obsidian"]);
		expect(mock.commands.map((c) => c.id)).toEqual(["create-from-template"]);

		const templates = await plugin.manager.loadEnabledTemplates();
		expect(templates).toHaveLength(1);

		const created = await plugin.manager.createNoteFromTemplate({
			template: templates[0],
			titleInput: "アイデア",
			prompts: { トピック: "設計" },
			now: new Date(2026, 10, 1, 13, 30, 0),
		});

		expect(created.path).toBe("notes/2026/アイデア.md");
		expect(mock.folders.has("notes/2026")).toBe(true);
		expect(mock.files.get("notes/2026/アイデア.md")).toBe(
			[
				"---",
				"type: note",
				'created: "2026-11-01T13:30:00+09:00"',
				'topic: "設計"',
				"---",
				"",
				"# アイデア",
				"",
				"本文",
			].join("\n"),
		);
		expect(mock.getOpenedPath()).toBe("notes/2026/アイデア.md");
		expect(mock.getCursorPos()).toEqual({ line: 8, ch: 0 });

		// 同名ファイルがあるときは上書きしない
		await expect(
			plugin.manager.createNoteFromTemplate({
				template: templates[0],
				titleInput: "アイデア",
				prompts: { トピック: "別内容" },
				now: new Date(2026, 10, 1, 13, 30, 0),
			}),
		).rejects.toThrow("すでに同じ名前のファイルがあります");

		// 設定の更新と、壊れた config.json の上書き防止
		await plugin.manager.saveConfig([{ file: "note.md", enabled: true, folder: "memo", fileNamePattern: "" }]);
		expect((await plugin.manager.loadConfig()).entries[0]?.folder).toBe("memo");

		mock.files.set("template/config.json", "{broken");
		await expect(
			plugin.manager.saveConfig([{ file: "note.md", enabled: true, folder: "memo2", fileNamePattern: "" }]),
		).rejects.toThrow("書式エラーがあるため上書きできません");
	});
});
