import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const bundlePath = fileURLToPath(new URL("../../../../../.obsidian/plugins/pkm-task/main.js", import.meta.url));
const require = createRequire(import.meta.url);

/** main.js の読み込みと onload に必要な分だけの Obsidian API */
function obsidianMock() {
	const commands: { id: string; name: string }[] = [];
	const extensions: unknown[] = [];
	const views: string[] = [];
	const creators = new Map<string, (leaf: unknown) => { getViewType(): string; getDisplayText(): string; getIcon(): string }>();
	const events: string[] = [];
	let layoutReady: (() => void) | null = null;
	/** 本物の ItemView と同じく、コンストラクタの中で getViewType を呼ぶ */
	class ItemView {
		constructor(readonly leaf: unknown) {
			(this as unknown as { getViewType(): string }).getViewType();
		}
	}
	class Plugin {
		app = {
			vault: { getFiles: () => [], getMarkdownFiles: () => [], on: () => ({}) },
			metadataCache: { on: (name: string) => (events.push(`metadataCache:${name}`), {}), getFileCache: () => null },
			workspace: {
				onLayoutReady: (fn: () => void) => (layoutReady = fn),
				on: (name: string) => (events.push(`workspace:${name}`), {}),
				iterateAllLeaves: () => {},
				getActiveViewOfType: () => null,
			},
		};
		registerEditorExtension(ext: unknown) {
			extensions.push(ext);
		}
		addCommand(c: { id: string; name: string }) {
			commands.push(c);
		}
		addRibbonIcon() {}
		registerEvent() {}
		register() {}
		registerView(type: string, creator: (leaf: unknown) => { getViewType(): string; getDisplayText(): string; getIcon(): string }) {
			views.push(type);
			creators.set(type, creator);
		}
		addSettingTab() {}
		async loadData() {
			return null;
		}
		async saveData() {}
	}
	class Modal {}
	return {
		obsidian: {
			Plugin,
			Modal,
			ItemView,
			PluginSettingTab: class {},
			Setting: class {},
			SuggestModal: Modal,
			FuzzySuggestModal: Modal,
			Notice: class {},
			Menu: class {},
			Keymap: {},
			MarkdownView: class {},
			Platform: { isMobile: false },
			TFile: class {},
			editorInfoField: {},
			normalizePath: (p: string) => p,
		},
		commands,
		extensions,
		events,
		views,
		creators,
		ready: () => layoutReady?.(),
	};
}

describe.skipIf(!existsSync(bundlePath))("ビルド済み main.js", () => {
	it("Obsidian 以外を require せず、onload でコマンドと画面のヘッダーの差し込みを登録する（ADR-0077）", async () => {
		const mock = obsidianMock();
		const required = new Set<string>();
		const req = (name: string) => {
			required.add(name);
			if (name === "obsidian") return mock.obsidian;
			throw new Error(`unexpected require: ${name}`);
		};
		const module = { exports: {} as { default: new () => { onload(): Promise<void> } } };
		new Function("module", "exports", "require", readFileSync(bundlePath, "utf8"))(module, module.exports, req);
		const plugin = new module.exports.default();
		await plugin.onload();
		mock.ready();
		expect([...required].sort()).toEqual(["obsidian"]);
		expect(mock.commands.map((c) => c.id)).toEqual([
			"open-daily",
			"open-issues",
			"open-inbox",
			"open-organize",
			"open-scheduled",
			"open-someday",
			"open-routines",
			"open-groups",
			"open-members",
			"open-labels",
			"open-sidebar",
			"capture-issues",
		]);
		expect(mock.views).toHaveLength(11);
		// ヘッダーは CodeMirror の widget ではなく、ノートを開いたときに差し込む
		expect(mock.extensions).toHaveLength(0);
		expect(mock.events).toEqual(expect.arrayContaining(["workspace:file-open", "workspace:active-leaf-change", "workspace:layout-change"]));
	});

	it("登録した View をすべて作れる（親のコンストラクタが getViewType を呼んでも落ちない）", async () => {
		const mock = obsidianMock();
		const req = (name: string) => (name === "obsidian" ? mock.obsidian : require(name));
		const module = { exports: {} as { default: new () => { onload(): Promise<void> } } };
		new Function("module", "exports", "require", readFileSync(bundlePath, "utf8"))(module, module.exports, req);
		await new module.exports.default().onload();
		expect(mock.creators.size).toBe(11);
		for (const [type, create] of mock.creators) {
			const view = create({});
			expect(view.getViewType()).toBe(type);
			expect(view.getDisplayText()).not.toBe("");
			expect(view.getIcon()).not.toBe("");
		}
	});
});
