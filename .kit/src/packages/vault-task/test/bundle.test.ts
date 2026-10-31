import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const bundlePath = fileURLToPath(new URL("../../../../.obsidian/plugins/vault-task/main.js", import.meta.url));
const require = createRequire(import.meta.url);

/** main.js の読み込みと onload に必要な分だけの Obsidian API */
function obsidianMock() {
	const commands: { id: string; name: string }[] = [];
	const extensions: unknown[] = [];
	const views: string[] = [];
	let layoutReady: (() => void) | null = null;
	class Plugin {
		app = {
			vault: { getFiles: () => [], getMarkdownFiles: () => [], on: () => ({}) },
			metadataCache: { on: () => ({}), getFileCache: () => null },
			workspace: { onLayoutReady: (fn: () => void) => (layoutReady = fn) },
		};
		registerEditorExtension(ext: unknown) {
			extensions.push(ext);
		}
		addCommand(c: { id: string; name: string }) {
			commands.push(c);
		}
		addRibbonIcon() {}
		registerEvent() {}
		registerView(type: string) {
			views.push(type);
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
			ItemView: class {},
			PluginSettingTab: class {},
			Setting: class {},
			SuggestModal: Modal,
			FuzzySuggestModal: Modal,
			Notice: class {},
			Menu: class {},
			Keymap: {},
			Platform: { isMobile: false },
			TFile: class {},
			editorInfoField: {},
			normalizePath: (p: string) => p,
		},
		commands,
		extensions,
		views,
		ready: () => layoutReady?.(),
	};
}

describe.skipIf(!existsSync(bundlePath))("ビルド済み main.js", () => {
	it("Obsidian と CodeMirror 以外を require せず、onload でコマンドとエディタ拡張を登録する", async () => {
		const mock = obsidianMock();
		const required = new Set<string>();
		const req = (name: string) => {
			required.add(name);
			if (name === "obsidian") return mock.obsidian;
			if (name === "@codemirror/state" || name === "@codemirror/view") return require(name);
			throw new Error(`unexpected require: ${name}`);
		};
		const module = { exports: {} as { default: new () => { onload(): Promise<void> } } };
		new Function("module", "exports", "require", readFileSync(bundlePath, "utf8"))(module, module.exports, req);
		const plugin = new module.exports.default();
		await plugin.onload();
		mock.ready();
		expect([...required].sort()).toEqual(["@codemirror/state", "@codemirror/view", "obsidian"]);
		expect(mock.commands.map((c) => c.id)).toEqual([
			"open-daily",
			"open-issues",
			"open-inbox",
			"open-organize",
			"open-scheduled",
			"open-someday",
			"open-routines",
			"open-groups",
			"capture-issues",
		]);
		expect(mock.views).toHaveLength(8);
		expect(mock.extensions).toHaveLength(1);
	});
});
