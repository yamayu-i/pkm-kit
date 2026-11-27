import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const bundlePath = fileURLToPath(new URL("../../../../../.obsidian/plugins/pkm-html/main.js", import.meta.url));

function load(files: Record<string, unknown> = {}) {
	const views: string[] = [];
	const extensions: [string[], string][] = [];
	const commands: string[] = [];
	const callbacks: Record<string, () => void> = {};
	const checks: Record<string, (checking: boolean) => boolean> = {};
	const events: Record<string, (...args: unknown[]) => void> = {};
	const opened: unknown[] = [];
	const openedWithDefaultApp: string[] = [];
	let activeFile: unknown = null;
	const notices: string[] = [];
	class TFile {
		constructor(
			public extension: string,
			public path = `file.${extension}`,
		) {}
	}
	class Plugin {
		app = {
			workspace: {
				on: (name: string, cb: (...args: unknown[]) => void) => {
					events[name] = cb;
					return {};
				},
				getActiveFile: () => activeFile,
				getLeaf: (kind: string) => ({ openFile: async (f: unknown) => opened.push([kind, f]) }),
			},
			vault: { getAbstractFileByPath: (p: string) => files[p] ?? null },
			openWithDefaultApp: (path: string) => openedWithDefaultApp.push(path),
		};
		addCommand(c: { id: string; callback?: () => void; checkCallback?: (checking: boolean) => boolean }) {
			commands.push(c.id);
			if (c.callback) callbacks[c.id] = c.callback;
			if (c.checkCallback) checks[c.id] = c.checkCallback;
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
	const setActiveFile = (f: unknown) => {
		activeFile = f;
	};
	return { plugin: new module.exports.default(), views, extensions, required, commands, callbacks, checks, events, opened, openedWithDefaultApp, notices, TFile, setActiveFile };
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

	it("Open in browser（ADR-0253）: スライド以外の HTML も OS のブラウザで開く。HTML でなければ出さない", async () => {
		const t = load();
		await t.plugin.onload();
		const check = t.checks["open-slide-in-browser"]!;
		t.setActiveFile(new t.TFile("md", "notes/a.md"));
		expect(check(true)).toBe(false);
		t.setActiveFile(new t.TFile("html", "notes/report.html"));
		expect(check(true)).toBe(true);
		check(false);
		t.setActiveFile(new t.TFile("htm", "slide/roadmap/index.htm"));
		check(false);
		expect(t.openedWithDefaultApp).toEqual(["notes/report.html", "slide/roadmap/index.htm"]);
	});

	it("ファイルのメニュー（ADR-0253）: HTML ならどれにも Open in browser を出す", async () => {
		const t = load();
		await t.plugin.onload();
		const titles = (file: unknown) => {
			const items: string[] = [];
			const item = { setTitle: (s: string) => (items.push(s), item), setIcon: () => item, onClick: () => item };
			t.events["file-menu"]!({ addItem: (f: (i: typeof item) => void) => f(item) }, file);
			return items;
		};
		expect(titles(new t.TFile("html", "notes/report.html"))).toEqual(["Open in browser", "Export HTML to tmp/"]);
		expect(titles(new t.TFile("html", "slide/roadmap/index.html"))).toEqual(["Open in browser", "Export HTML to tmp/"]);
		expect(titles(new t.TFile("md", "notes/a.md"))).toEqual([]);
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
