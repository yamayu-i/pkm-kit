import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const bundlePath = fileURLToPath(new URL("../../../../../.obsidian/plugins/pkm-diagram/main.js", import.meta.url));

/** ビルド済みの main.js を、Obsidian の API のモックの上で、Buffer も Node の API もない状態（モバイル相当）で動かす */
function load() {
	const commands: string[] = [];
	const workspaceEvents: string[] = [];
	const vaultEvents: string[] = [];
	const domEvents: string[] = [];
	class Plugin {
		app = {
			workspace: { on: (name: string) => (workspaceEvents.push(name), {}) },
			vault: { on: (name: string) => (vaultEvents.push(name), {}) },
		};
		addCommand(c: { id: string }) {
			commands.push(c.id);
		}
		registerEvent() {}
		registerDomEvent(_doc: unknown, type: string) {
			domEvents.push(type);
		}
	}
	const el = (): Record<string, unknown> => ({
		hidden: false,
		style: {},
		createDiv: () => el(),
		createEl: () => el(),
		createSpan: () => el(),
		addEventListener() {},
		remove() {},
	});
	const fakeDocument = { body: el() };
	const obsidian = { Plugin, Modal: class {}, SuggestModal: class {}, Setting: class {}, Menu: class {}, Notice: class {}, MarkdownView: class {}, TFile: class {}, setIcon() {} };
	const module = { exports: {} as { default: new () => { onload(): Promise<void>; onunload(): void } } };
	const required = new Set<string>();
	const req = (name: string) => {
		required.add(name);
		if (name === "obsidian") return obsidian;
		throw new Error(`unexpected require: ${name}`);
	};
	new Function("module", "exports", "require", "document", "Buffer", "process", readFileSync(bundlePath, "utf8"))(module, module.exports, req, fakeDocument, undefined, undefined);
	return { plugin: new module.exports.default(), commands, workspaceEvents, vaultEvents, domEvents, required };
}

describe.skipIf(!existsSync(bundlePath))("ビルド済み main.js（ADR-0102、ADR-0111）", () => {
	it("obsidian 以外を require せず、コマンドとイベントを登録する", async () => {
		const r = load();
		await r.plugin.onload();
		expect([...r.required]).toEqual(["obsidian"]);
		expect(r.commands).toEqual(["copy-diagram", "save-diagram-png", "expand-diagram", "export-to-tmp"]);
		expect(r.workspaceEvents).toEqual(["window-open", "window-close", "layout-change", "file-menu"]);
		expect(r.vaultEvents).toEqual(["create", "delete", "rename"]);
		expect(r.domEvents).toEqual(["pointerover", "pointerdown", "scroll", "keydown"]);
		r.plugin.onunload();
	});

	it("外部の origin・iframe・Draw.io を持たない（ADR-0111）。.svg の拡張子を View に登録しない（標準の画像の表示のまま）", () => {
		const bundle = readFileSync(bundlePath, "utf8");
		expect(bundle).not.toContain("diagrams.net");
		expect(bundle).not.toContain("allow-scripts");
		// 「iframe」は SVG の検査の禁止の一覧にだけ出る。iframe を作らない
		expect(bundle).not.toMatch(/create(El|Element)\("iframe"/);
		expect(bundle).not.toContain("registerExtensions");
		expect(bundle).not.toMatch(/postMessage\([^)]*"\*"\)/);
		// トークンは styles.css に連結する（main.js には束ねない）
		expect(readFileSync(bundlePath.replace(/main\.js$/, "styles.css"), "utf8")).toContain("--vt-surface:");
	});
});
