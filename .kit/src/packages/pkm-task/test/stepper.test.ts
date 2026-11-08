import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { stepperItems } from "../src/core/stepper";

const STEPS = [
	{ key: "a", label: "Overdue" },
	{ key: "b", label: "Previous boards" },
	{ key: "c", label: "Due soon" },
] as const;

describe("段階表示（DailyTaskView）", () => {
	it("今の段階だけ名前と件数を出し、ほかは番号の丸に縮める", () => {
		const items = stepperItems(STEPS, "b", { a: 2, b: 1, c: 0 }, new Set());
		expect(items.map((i) => [i.key, i.compact])).toEqual([
			["a", true],
			["b", false],
			["c", true],
		]);
		expect(items[1]).toMatchObject({ state: "current", count: 1, number: 2 });
	});

	it("縮めた段階は、件数を点で示し、名前と件数はツールチップで分かる", () => {
		const [dead, , caution] = stepperItems(STEPS, "b", { a: 2, b: 1, c: 0 }, new Set());
		expect(dead).toMatchObject({ state: "todo", count: 2, title: "1. Overdue (2)" });
		expect(caution).toMatchObject({ state: "done", count: 0, title: "3. Due soon (Done)" });
	});

	it("通り過ぎた段階は件数が残っていても済みにする", () => {
		const [dead] = stepperItems(STEPS, "c", { a: 2, b: 0, c: 0 }, new Set(["a"]));
		expect(dead).toMatchObject({ state: "done", title: "1. Overdue (Done · 2)" });
	});
});

describe("段階表示の CSS", () => {
	it("狭いペインでも横スクロールにしない", () => {
		const css = readFileSync(fileURLToPath(new URL("../styles.css", import.meta.url)), "utf8");
		const rule = css.match(/\.vt-stepper\s*\{([^}]*)\}/)?.[1] ?? "";
		expect(rule).not.toMatch(/overflow-x:\s*auto/);
	});
});
