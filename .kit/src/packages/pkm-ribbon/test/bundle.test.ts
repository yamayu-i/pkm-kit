import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const bundlePath = fileURLToPath(new URL("../../../../../.obsidian/plugins/pkm-ribbon/main.js", import.meta.url));

/** リボンのボタンの要素の、pkm-ribbon が使う部分だけを真似る */
class FakeEl {
	children: FakeEl[] = [];
	attrs = new Map<string, string>();
	classes = new Set<string>();
	className = "";
	textContent = "";
	parent: FakeEl | null = null;
	querySelector(sel: string): FakeEl | null {
		const cls = sel.replace(/^\./, "");
		return this.children.find((c) => c.className === cls) ?? null;
	}
	appendChild(c: FakeEl) {
		c.parent = this;
		this.children.push(c);
	}
	remove() {
		if (this.parent) this.parent.children = this.parent.children.filter((c) => c !== this);
	}
	setAttribute(k: string, v: string) {
		this.attrs.set(k, v);
	}
	addClass(c: string) {
		this.classes.add(c);
	}
	removeClass(c: string) {
		this.classes.delete(c);
	}
	badge(): string | null {
		return this.querySelector(".vt-ribbon-badge")?.textContent ?? null;
	}
}

interface Options {
	commands?: Set<string>;
	plugins?: Record<string, { getRibbonBadge?: (command: string) => number | null }>;
}

function load({ commands = new Set(), plugins = {} }: Options = {}) {
	const ribbon: { icon: string; title: string; run: () => void; el: FakeEl }[] = [];
	const executed: string[] = [];
	const notices: string[] = [];
	const handlers = new Map<string, ((...a: unknown[]) => void)[]>();
	const ready: (() => void)[] = [];
	class Plugin {
		app = {
			commands: {
				executeCommandById: (id: string) => {
					if (!commands.has(id)) return false;
					executed.push(id);
					return true;
				},
			},
			plugins: { getPlugin: (id: string) => plugins[id] ?? null },
			workspace: {
				on: (name: string, fn: (...a: unknown[]) => void) => {
					handlers.set(name, [...(handlers.get(name) ?? []), fn]);
					return { name };
				},
				onLayoutReady: (fn: () => void) => ready.push(fn),
			},
		};
		addRibbonIcon(icon: string, title: string, run: () => void) {
			const el = new FakeEl();
			ribbon.push({ icon, title, run, el });
			return el;
		}
		registerEvent() {}
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
	const trigger = (name: string, ...args: unknown[]) => {
		for (const fn of handlers.get(name) ?? []) fn(...args);
	};
	const layoutReady = () => {
		for (const fn of ready) fn();
	};
	return { ribbon, executed, notices, required, trigger, layoutReady };
}

const ORDER = [
	["calendar", "Open today's daily note", "pkm-template:open-todays-daily"],
	["sun", "Open Today", "pkm-task:open-daily"],
	["bell", "Open PKM Updates", "pkm-updates:open-view"],
	["list-plus", "Capture issues", "pkm-task:capture-issues"],
	["arrow-down-to-line", "Git: pull", "pkm-git:pull"],
	["arrow-up-from-line", "Git: push", "pkm-git:push"],
];

describe.skipIf(!existsSync(bundlePath))("ビルド済み main.js（ADR-0029、ADR-0070）", () => {
	const g = globalThis as unknown as { document?: unknown };
	let saved: unknown;
	beforeEach(() => {
		saved = g.document;
		g.document = { createElement: () => new FakeEl() };
	});
	afterEach(() => {
		g.document = saved;
	});

	it("obsidian 以外を require せず、表の順にボタンを登録する", () => {
		const { ribbon, required } = load();
		expect([...required]).toEqual(["obsidian"]);
		expect(ribbon.map((r) => [r.icon, r.title])).toEqual(ORDER.map(([icon, title]) => [icon, title]));
	});

	it("押すと、それぞれのコマンドを ID で呼ぶ", () => {
		const { ribbon, executed, notices } = load({ commands: new Set(ORDER.map((o) => o[2] as string)) });
		for (const r of ribbon) r.run();
		expect(executed).toEqual(ORDER.map((o) => o[2]));
		expect(notices).toEqual([]);
	});

	it("コマンドがない（プラグインが無効）ときは、Notice でプラグインの名前を伝える", () => {
		const { ribbon, notices } = load();
		for (const r of ribbon) r.run();
		expect(notices).toHaveLength(ORDER.length);
		expect(notices[0]).toContain("pkm-template");
		expect(notices[2]).toContain("pkm-updates");
		expect(notices[4]).toContain("pkm-git");
	});

	describe("バッジ（ADR-0070 の 6）", () => {
		it("起動の後に尋ねて出す。100 以上は 99+、0 と null は出さない", () => {
			let count: number | null = 3;
			const asked: string[] = [];
			const { ribbon, layoutReady, trigger } = load({
				plugins: {
					"pkm-updates": {
						getRibbonBadge: (command) => {
							asked.push(command);
							return command === "pkm-updates:open-view" ? count : null;
						},
					},
				},
			});
			const el = ribbon[2]!.el;
			expect(el.badge()).toBeNull();
			layoutReady();
			expect(asked).toEqual(["pkm-updates:open-view"]);
			expect(el.badge()).toBe("3");
			expect(el.attrs.get("aria-label")).toBe("Open PKM Updates (3)");
			expect(el.classes.has("vt-ribbon-badge-host")).toBe(true);

			count = 99;
			trigger("pkm-ribbon:badge-changed", "pkm-updates:open-view");
			expect(el.badge()).toBe("99");
			count = 100;
			trigger("pkm-ribbon:badge-changed", "pkm-updates:open-view");
			expect(el.badge()).toBe("99+");
			expect(el.children).toHaveLength(1);
			count = 0;
			trigger("pkm-ribbon:badge-changed", "pkm-updates:open-view");
			expect(el.badge()).toBeNull();
			expect(el.attrs.get("aria-label")).toBe("Open PKM Updates");
			count = null;
			trigger("pkm-ribbon:badge-changed", "pkm-updates:open-view");
			expect(el.badge()).toBeNull();
			// ほかのボタンには出さない
			expect(ribbon.filter((r) => r.el.badge() !== null)).toHaveLength(0);
		});

		it("プラグインがない・メソッドがない・例外のときは出さない。表にないコマンドは無視する", () => {
			const { ribbon, layoutReady, trigger } = load({
				plugins: {
					"pkm-task": {},
					"pkm-git": {
						getRibbonBadge: () => {
							throw new Error("壊れている");
						},
					},
				},
			});
			layoutReady();
			trigger("pkm-ribbon:badge-changed", "pkm-git:pull");
			trigger("pkm-ribbon:badge-changed", "other:command");
			trigger("pkm-ribbon:badge-changed", 42);
			expect(ribbon.filter((r) => r.el.badge() !== null)).toHaveLength(0);
		});
	});
});
