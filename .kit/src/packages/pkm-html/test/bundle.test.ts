import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const bundlePath = fileURLToPath(new URL("../../../../../.obsidian/plugins/pkm-html/main.js", import.meta.url));

function load() {
	const views: string[] = [];
	const extensions: [string[], string][] = [];
	const commands: string[] = [];
	class Plugin {
		app = { workspace: { on: () => ({}), getActiveFile: () => null } };
		addCommand(c: { id: string }) {
			commands.push(c.id);
		}
		registerEvent() {}
		registerView(type: string) {
			views.push(type);
		}
		registerExtensions(exts: string[], type: string) {
			extensions.push([exts, type]);
		}
	}
	const obsidian = { Plugin, FileView: class {}, TFile: class {}, Notice: class {} };
	const module = { exports: {} as { default: new () => { onload(): Promise<void> } } };
	const required = new Set<string>();
	const req = (name: string) => {
		required.add(name);
		if (name === "obsidian") return obsidian;
		throw new Error(`unexpected require: ${name}`);
	};
	new Function("module", "exports", "require", readFileSync(bundlePath, "utf8"))(module, module.exports, req);
	return { plugin: new module.exports.default(), views, extensions, required, commands };
}

describe.skipIf(!existsSync(bundlePath))("ビルド済み main.js（ADR-0037）", () => {
	it("obsidian 以外を require せず、.html / .htm を View に登録する", async () => {
		const { plugin, views, extensions, required, commands } = load();
		await plugin.onload();
		expect([...required]).toEqual(["obsidian"]);
		expect(views).toEqual(["pkm-html"]);
		expect(extensions).toEqual([[["html", "htm"], "pkm-html"]]);
		expect(commands).toEqual(["export-to-tmp"]);
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
