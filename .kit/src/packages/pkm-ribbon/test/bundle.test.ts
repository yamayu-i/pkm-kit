import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const bundlePath = fileURLToPath(new URL("../../../../../.obsidian/plugins/pkm-ribbon/main.js", import.meta.url));

function load(commands: Set<string>) {
	const ribbon: { icon: string; title: string; run: () => void }[] = [];
	const executed: string[] = [];
	const notices: string[] = [];
	class Plugin {
		app = {
			commands: {
				executeCommandById: (id: string) => {
					if (!commands.has(id)) return false;
					executed.push(id);
					return true;
				},
			},
		};
		addRibbonIcon(icon: string, title: string, run: () => void) {
			ribbon.push({ icon, title, run });
		}
	}
	const obsidian = {
		Plugin,
		Notice: class {
			constructor(msg: string) {
				notices.push(msg);
			}
		},
	};
	const module = { exports: {} as { default: new () => { onload(): void } } };
	const required = new Set<string>();
	const req = (name: string) => {
		required.add(name);
		if (name === "obsidian") return obsidian;
		throw new Error(`unexpected require: ${name}`);
	};
	new Function("module", "exports", "require", readFileSync(bundlePath, "utf8"))(module, module.exports, req);
	new module.exports.default().onload();
	return { ribbon, executed, notices, required };
}

describe.skipIf(!existsSync(bundlePath))("ビルド済み main.js（ADR-0029）", () => {
	it("obsidian 以外を require せず、デイリーノート → Daily の順に続けてボタンを登録する", () => {
		const { ribbon, required } = load(new Set());
		expect([...required]).toEqual(["obsidian"]);
		expect(ribbon.map((r) => [r.icon, r.title])).toEqual([
			["calendar", "今日のデイリーノートを開く"],
			["calendar-check", "Daily を開く"],
		]);
	});

	it("押すと、pkm-template と pkm-task のコマンドを ID で呼ぶ", () => {
		const { ribbon, executed, notices } = load(new Set(["pkm-template:open-todays-daily", "pkm-task:open-daily"]));
		for (const r of ribbon) r.run();
		expect(executed).toEqual(["pkm-template:open-todays-daily", "pkm-task:open-daily"]);
		expect(notices).toEqual([]);
	});

	it("コマンドがない（プラグインが無効）ときは、Notice で伝える", () => {
		const { ribbon, notices } = load(new Set());
		for (const r of ribbon) r.run();
		expect(notices).toHaveLength(2);
		expect(notices[0]).toContain("pkm-template");
		expect(notices[1]).toContain("pkm-task");
	});
});
