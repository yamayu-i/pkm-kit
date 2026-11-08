import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const bundlePath = fileURLToPath(new URL("../../../../../.obsidian/plugins/pkm-updates/main.js", import.meta.url));

interface File {
	path: string;
	basename: string;
	frontmatter: Record<string, unknown>;
}

async function load(files: File[]) {
	const views: string[] = [];
	const commands: { id: string; name: string }[] = [];
	const triggered: unknown[][] = [];
	const ribbon: string[] = [];
	class TFile {}
	const tfiles = files.map((f) => Object.assign(new TFile(), { path: f.path, basename: f.basename, stat: { mtime: 0 } }));
	class Plugin {
		app = {
			vault: {
				getFiles: () => tfiles,
				getMarkdownFiles: () => tfiles,
				on: (name: string) => name,
			},
			metadataCache: {
				on: (name: string) => name,
				getFileCache: (f: { path: string }) => ({ frontmatter: files.find((x) => x.path === f.path)?.frontmatter }),
			},
			workspace: {
				onLayoutReady: (fn: () => void) => fn(),
				trigger: (...args: unknown[]) => triggered.push(args),
			},
		};
		registerView(type: string) {
			views.push(type);
		}
		registerEvent() {}
		register() {}
		addCommand(c: { id: string; name: string }) {
			commands.push(c);
		}
		addRibbonIcon(icon: string) {
			ribbon.push(icon);
		}
	}
	const obsidian = { Plugin, TFile, ItemView: class {}, Notice: class {}, Keymap: {}, Platform: {}, normalizePath: (p: string) => p };
	const module = { exports: {} as { default: new () => { onload(): Promise<void>; getRibbonBadge(c: string): number | null } } };
	const required = new Set<string>();
	const req = (name: string) => {
		required.add(name);
		if (name === "obsidian") return obsidian;
		throw new Error(`unexpected require: ${name}`);
	};
	new Function("module", "exports", "require", readFileSync(bundlePath, "utf8"))(module, module.exports, req);
	const plugin = new module.exports.default();
	await plugin.onload();
	// load は非同期（Viewed のログを読む）
	await new Promise((r) => setTimeout(r, 0));
	return { plugin, views, commands, triggered, ribbon, required };
}

const T = "2026-11-08T10:00:00+09:00";

describe.skipIf(!existsSync(bundlePath))("ビルド済み main.js（ADR-0070）", () => {
	it("obsidian 以外を require せず、View とコマンドを登録する。リボンには登録しない（pkm-ribbon が出す）", async () => {
		const { views, commands, ribbon, required } = await load([]);
		expect([...required]).toEqual(["obsidian"]);
		expect(views).toEqual(["pkm-updates-view"]);
		expect(commands.map((c) => [c.id, c.name])).toEqual([["open-view", "PKM Updates を開く"]]);
		expect(ribbon).toEqual([]);
	});

	it("バッジの数は重複を除いたノートの数。ほかのコマンドには null。変わったら pkm-ribbon に知らせる", async () => {
		const { plugin, triggered } = await load([
			{ path: "issue/i-1.md", basename: "i-1", frontmatter: { type: "issue", schema: 1, id: "i-1", summary: "a", status: "open", created: T, updated: T } },
			{ path: "a.md", basename: "a", frontmatter: { type: "note", created: T, updated: T } },
			{ path: "b.md", basename: "b", frontmatter: { type: "note", created: T } },
		]);
		expect(plugin.getRibbonBadge("pkm-updates:open-view")).toBe(2);
		expect(plugin.getRibbonBadge("pkm-task:open-daily")).toBeNull();
		expect(triggered).toEqual([["pkm-ribbon:badge-changed", "pkm-updates:open-view"]]);
	});
});
