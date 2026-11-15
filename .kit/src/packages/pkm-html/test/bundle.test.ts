import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const bundlePath = fileURLToPath(new URL("../../../../../.obsidian/plugins/pkm-html/main.js", import.meta.url));

function load(files: Record<string, unknown> = {}) {
	const views: string[] = [];
	const extensions: [string[], string][] = [];
	const commands: string[] = [];
	const callbacks: Record<string, () => void> = {};
	const opened: unknown[] = [];
	const notices: string[] = [];
	class TFile {
		constructor(public extension: string) {}
	}
	class Plugin {
		app = {
			workspace: { on: () => ({}), getActiveFile: () => null, getLeaf: (kind: string) => ({ openFile: async (f: unknown) => opened.push([kind, f]) }) },
			vault: { getAbstractFileByPath: (p: string) => files[p] ?? null },
		};
		addCommand(c: { id: string; callback?: () => void }) {
			commands.push(c.id);
			if (c.callback) callbacks[c.id] = c.callback;
		}
		registerEvent() {}
		registerView(type: string) {
			views.push(type);
		}
		registerExtensions(exts: string[], type: string) {
			extensions.push([exts, type]);
		}
	}
	const Notice = class {
		constructor(message: string) {
			notices.push(message);
		}
	};
	const obsidian = { Plugin, FileView: class {}, TFile, Notice };
	const module = { exports: {} as { default: new () => { onload(): Promise<void> } } };
	const required = new Set<string>();
	const req = (name: string) => {
		required.add(name);
		if (name === "obsidian") return obsidian;
		throw new Error(`unexpected require: ${name}`);
	};
	new Function("module", "exports", "require", readFileSync(bundlePath, "utf8"))(module, module.exports, req);
	return { plugin: new module.exports.default(), views, extensions, required, commands, callbacks, opened, notices, TFile };
}

describe.skipIf(!existsSync(bundlePath))("ビルド済み main.js（ADR-0037）", () => {
	it("obsidian 以外を require せず、.html / .htm を View に登録する", async () => {
		const { plugin, views, extensions, required, commands } = load();
		await plugin.onload();
		expect([...required]).toEqual(["obsidian"]);
		expect(views).toEqual(["pkm-html"]);
		expect(extensions).toEqual([[["html", "htm"], "pkm-html"]]);
		expect(commands).toEqual(["export-to-tmp", "open-user-experience-guide", "open-slide-in-browser"]);
	});

	it("体験定義書を開くコマンド（ADR-0042）: あれば新しいタブに開き、なければ通知する", async () => {
		const missing = load();
		await missing.plugin.onload();
		missing.callbacks["open-user-experience-guide"]!();
		expect(missing.opened).toEqual([]);
		expect(missing.notices.join("\n")).toContain("pkm-guide/user-experience.html がありません");

		const files: Record<string, unknown> = {};
		const present = load(files);
		const guide = new present.TFile("html");
		files["pkm-guide/user-experience.html"] = guide;
		await present.plugin.onload();
		present.callbacks["open-user-experience-guide"]!();
		await Promise.resolve();
		expect(present.opened).toEqual([["tab", guide]]);
		expect(present.notices).toEqual([]);
	});

	it("iframe の sandbox に allow-scripts を付けない。CSP とトークンを束ねている", () => {
		const bundle = readFileSync(bundlePath, "utf8");
		expect(bundle).not.toContain("allow-scripts");
		expect(bundle).toContain('"allow-same-origin"');
		expect(bundle).toContain("default-src 'none'");
		expect(bundle).toContain("--vt-surface:");
		// 書き出し（ADR-0044）の prefers-color-scheme 版のトークン
		expect(bundle).toContain("@media (prefers-color-scheme: dark)");
	});
});
