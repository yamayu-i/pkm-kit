import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const bundlePath = fileURLToPath(new URL("../../../../../.obsidian/plugins/vault-template/main.js", import.meta.url));

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
	const views: string[] = [];
	const events: string[] = [];
	const settingTabs: unknown[] = [];
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

	// Obsidian と同じく、隠しパス（.kit/ など）は Vault の索引に載らず、アダプタからだけ見える
	const hidden = (path: string) => path.split("/").some((part) => part.startsWith("."));
	const indexed = () => [...files.keys()].filter((p) => !hidden(p));
	const adapter = {
		exists: async (path: string) => files.has(path) || [...files.keys()].some((p) => p.startsWith(`${path}/`)),
		read: async (path: string) => {
			const text = files.get(path);
			if (text === undefined) throw new Error(`ENOENT: ${path}`);
			return text;
		},
		list: async (dir: string) => {
			const children = [...files.keys()].filter((p) => p.startsWith(`${dir}/`)).map((p) => p.slice(dir.length + 1));
			return {
				files: children.filter((c) => !c.includes("/")).map((c) => `${dir}/${c}`),
				folders: [...new Set(children.filter((c) => c.includes("/")).map((c) => `${dir}/${c.split("/")[0]}`))],
			};
		},
	};

	const vault = {
		adapter,
		getFiles: () => indexed().map(toTFile),
		getMarkdownFiles: () => indexed().filter((p) => p.endsWith(".md")).map(toTFile),
		getFileByPath: (path: string) => (files.has(path) && !hidden(path) ? toTFile(path) : null),
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
				on: (name: string) => name,
				onLayoutReady: () => {},
				iterateAllLeaves: () => {},
				// 一覧ペイン（ADR-0033）がない状態: ルートのタブは無い扱い
				iterateRootLeaves: () => {},
				getMostRecentLeaf: () => null,
			},
			metadataCache: { on: (name: string) => name, getFileCache: () => null, resolvedLinks: {} },
		};
		registerView(type: string) {
			views.push(type);
		}
		registerEvent(ref: string) {
			events.push(ref);
		}
		register() {}
		addCommand(c: { id: string; name: string; callback?: () => void }) {
			commands.push(c);
		}
		addRibbonIcon() {}
		addSettingTab(tab: unknown) {
			settingTabs.push(tab);
		}
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
			ItemView: class {},
			Notice: class {
				constructor(msg: string) {
					notices.push(msg);
				}
			},
			Platform: { isMobile: false, isPhone: false },
			TFile: class {},
			normalizePath: (p: string) => p.replace(/^\/+|\/+$/g, ""),
			setIcon: () => {},
		},
		files,
		folders,
		commands,
		notices,
		views,
		settingTabs,
		events,
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
			".kit/templates/config.json": JSON.stringify({
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
		expect(mock.commands.map((c) => c.id)).toEqual(["create-from-template", "open-todays-daily", "open-daily-list", "open-note-list", "open-source-list"]);
		expect(mock.views).toEqual(["vault-template-daily-list", "vault-template-note-list", "vault-template-source-list"]);
		// 設定タブはない(ADR-0039)
		expect(mock.settingTabs).toEqual([]);
		// ヘッダーを差し込むための購読(ADR-0026)
		expect(mock.events).toEqual(expect.arrayContaining(["file-open", "layout-change", "active-leaf-change", "changed", "resolved"]));

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
	});
});

type BundlePlugin = {
	onload(): Promise<void>;
	manager: {
		loadEnabledTemplates(): Promise<unknown[]>;
		createNoteFromTemplate(opts: {
			template: unknown;
			titleInput: string;
			prompts: Record<string, string>;
			now: Date;
		}): Promise<{ path: string }>;
		openTodaysDaily(now: Date): Promise<{ path: string }>;
		loadConfig(): Promise<{ entries: { file: string; enabled: boolean; folder: string; fileNamePattern: string }[]; problems: string[] }>;
	};
};

async function loadBundle(mock: ReturnType<typeof createObsidianMock>): Promise<BundlePlugin> {
	const module = { exports: {} as { default: new () => BundlePlugin } };
	const req = (name: string) => {
		if (name === "obsidian") return mock.obsidian;
		throw new Error(`unexpected require: ${name}`);
	};
	new Function("module", "exports", "require", readFileSync(bundlePath, "utf8"))(module, module.exports, req);
	const plugin = new module.exports.default();
	await plugin.onload();
	return plugin;
}

const FM_TIME = 'created: "{{date:YYYY-MM-DDTHH:mm:ssZ}}"\nupdated: "{{date:YYYY-MM-DDTHH:mm:ssZ}}"';

describe.skipIf(!existsSync(bundlePath))("ビルド済み main.js: ID 採番と今日のデイリーノート", () => {
	it("{{id:m}} のテンプレートは、ファイル名を ID にし、入力を name にして連番で作る", async () => {
		const mock = createObsidianMock({
			"template/file/member.md": `---\nschema: 1\ntype: member\nid: "{{id:m}}"\nname: "{{title}}"\n${FM_TIME}\n---\n`,
			".kit/templates/config.json": JSON.stringify({
				templates: [{ file: "member.md", enabled: true, folder: "member", fileNamePattern: "{{id:m}}" }],
			}),
			"member/m-1.md": "---\n---\n",
			"member/m-4.md": "---\n---\n",
			"issue/i-9.md": "---\n---\n",
		});
		const plugin = await loadBundle(mock);
		const [template] = await plugin.manager.loadEnabledTemplates();

		const created = await plugin.manager.createNoteFromTemplate({
			template,
			titleInput: "山田 太郎",
			prompts: {},
			now: new Date(2026, 10, 1, 13, 30, 0),
		});

		expect(created.path).toBe("member/m-5.md");
		const text = mock.files.get("member/m-5.md")!;
		expect(text).toContain('id: "m-5"');
		expect(text).toContain('name: "山田 太郎"');
		expect(text).toMatch(/created: "(.+)"\nupdated: "\1"/);
	});

	it("今日のデイリーノートがあれば開き、なければ daily.md から作って開く（daily.md が無効でも）", async () => {
		const mock = createObsidianMock({
			"template/file/daily.md": `---\ntype: daily\n${FM_TIME}\n---\n`,
			".kit/templates/config.json": JSON.stringify({
				templates: [
					{ file: "daily.md", enabled: false, folder: "daily/{{date:YYYY}}/{{date:MM}}", fileNamePattern: "{{date:YYYY-MM-DD}}" },
				],
			}),
		});
		const plugin = await loadBundle(mock);
		const day = new Date(2026, 10, 1, 9, 0, 0);

		const created = await plugin.manager.openTodaysDaily(day);
		expect(created.path).toBe("daily/2026/11/2026-11-01.md");
		expect(mock.getOpenedPath()).toBe("daily/2026/11/2026-11-01.md");
		const text = mock.files.get("daily/2026/11/2026-11-01.md")!;
		expect(text).toMatch(/type: daily\ncreated: "(.+)"\nupdated: "\1"/);

		// 2 回目は作り直さず、手で書いた内容を保つ
		mock.files.set("daily/2026/11/2026-11-01.md", "手で書いた内容");
		await plugin.manager.openTodaysDaily(new Date(2026, 10, 1, 23, 0, 0));
		expect(mock.files.get("daily/2026/11/2026-11-01.md")).toBe("手で書いた内容");

		// 日付が変われば別のノートを作る
		const next = await plugin.manager.openTodaysDaily(new Date(2026, 10, 2, 0, 5, 0));
		expect(next.path).toBe("daily/2026/11/2026-11-02.md");
	});
});

describe.skipIf(!existsSync(bundlePath))("ビルド済み main.js: 上流の既定のテンプレート（.kit/templates/）との重ね合わせ", () => {
	const upstream = {
		".kit/templates/file/note.md": `---\ntype: note\n${FM_TIME}\n---\n\n上流の本文\n`,
		".kit/templates/file/daily.md": `---\ntype: daily\n${FM_TIME}\n---\n`,
		".kit/templates/config.json": JSON.stringify({
			templates: [
				{ file: "note.md", enabled: true, folder: "note", fileNamePattern: "{{title}}" },
				{ file: "daily.md", enabled: false, folder: "daily/{{date:YYYY}}/{{date:MM}}", fileNamePattern: "{{date:YYYY-MM-DD}}" },
			],
		}),
	};

	it("その Vault にテンプレートがなくても、上流のテンプレートと設定でノートを作れる", async () => {
		const mock = createObsidianMock(upstream);
		const plugin = await loadBundle(mock);
		const { entries, problems } = await plugin.manager.loadConfig();
		expect(problems).toEqual([]);
		expect(entries.map((e) => e.file)).toEqual(["note.md", "daily.md"]);

		const [template] = await plugin.manager.loadEnabledTemplates();
		const created = await plugin.manager.createNoteFromTemplate({ template, titleInput: "メモ", prompts: {}, now: new Date(2026, 10, 1, 9, 0, 0) });
		expect(created.path).toBe("note/メモ.md");
		expect(mock.files.get("note/メモ.md")).toContain("上流の本文");

		const daily = await plugin.manager.openTodaysDaily(new Date(2026, 10, 1, 9, 0, 0));
		expect(daily.path).toBe("daily/2026/11/2026-11-01.md");
	});

	it("同じ名前のテンプレートはその Vault のものを使う。その Vault の template/config.json は読まない（ADR-0039）", async () => {
		const mock = createObsidianMock({
			...upstream,
			"template/file/note.md": `---\ntype: note\n${FM_TIME}\n---\n\nこの Vault の本文\n`,
			"template/file/mine.md": `---\ntype: note\n${FM_TIME}\n---\n`,
			"template/config.json": JSON.stringify({ templates: [{ file: "mine.md", folder: "x" }, { file: "note.md", folder: "memo" }, { file: "daily.md", enabled: true }] }),
		});
		const plugin = await loadBundle(mock);
		const { entries, problems } = await plugin.manager.loadConfig();
		expect(problems).toEqual([]);
		expect(entries).toEqual([
			{ file: "note.md", enabled: true, folder: "note", fileNamePattern: "{{title}}" },
			{ file: "daily.md", enabled: false, folder: "daily/{{date:YYYY}}/{{date:MM}}", fileNamePattern: "{{date:YYYY-MM-DD}}" },
			{ file: "mine.md", enabled: true, folder: "", fileNamePattern: "" },
		]);

		const [template] = await plugin.manager.loadEnabledTemplates();
		const created = await plugin.manager.createNoteFromTemplate({ template, titleInput: "メモ", prompts: {}, now: new Date(2026, 10, 1, 9, 0, 0) });
		expect(created.path).toBe("note/メモ.md");
		expect(mock.files.get("note/メモ.md")).toContain("この Vault の本文");
		expect(mock.files.get("template/config.json")).toContain("memo");
	});

	it("設定を保存する手段を持たない", async () => {
		const plugin = await loadBundle(createObsidianMock(upstream));
		expect((plugin.manager as Record<string, unknown>).saveConfig).toBeUndefined();
	});
});
