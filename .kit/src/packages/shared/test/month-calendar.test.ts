import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { formatMonthTitle, monthWeeks, shiftMonth, WEEKDAY_INITIALS } from "../src/month-calendar.tsx";

describe("月のカレンダー（ADR-0078）", () => {
	it("見出しは英語の月と年", () => {
		expect(formatMonthTitle("2026-11")).toBe("November 2026");
		expect(formatMonthTitle("2027-01")).toBe("January 2027");
	});

	it("曜日は日曜始まりの 1 文字", () => {
		expect(WEEKDAY_INITIALS).toEqual(["S", "M", "T", "W", "T", "F", "S"]);
	});

	it("月を年をまたいで動かす", () => {
		expect(shiftMonth("2026-12", 1)).toBe("2027-01");
		expect(shiftMonth("2026-01", -1)).toBe("2025-12");
	});

	it("月の外の日は空け、要る週だけを並べる", () => {
		// 2026-11-01 は日曜、30 日まで → 5 週
		const nov = monthWeeks("2026-11");
		expect(nov).toHaveLength(5);
		expect(nov[0]![0]).toBe("2026-11-01");
		expect(nov[4]).toEqual(["2026-11-29", "2026-11-30", null, null, null, null, null]);
		// 2026-08-01 は土曜、31 日まで → 6 週
		const aug = monthWeeks("2026-08");
		expect(aug).toHaveLength(6);
		expect(aug[0]).toEqual([null, null, null, null, null, null, "2026-08-01"]);
		// 2026-02-01 は日曜、28 日まで → 4 週
		expect(monthWeeks("2026-02")).toHaveLength(4);
	});

	it("日は枠のない丸。今日は枠線、選んだ日は塗り", () => {
		const css = readFileSync(fileURLToPath(new URL("../src/month-calendar.css", import.meta.url)), "utf8");
		const rule = (selector: string) => new RegExp(`${selector.replace(/[.]/g, "\\.")}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? "";
		expect(rule(".vt-cal-day.vt-cal-day")).toMatch(/border:\s*1px solid transparent/);
		expect(rule(".vt-cal-day.vt-cal-day")).toMatch(/border-radius:\s*var\(--vt-radius-full\)/);
		expect(rule(".vt-cal-day.vt-cal-day.is-today")).toMatch(/border-color:/);
		expect(rule(".vt-cal-day.vt-cal-day.is-today")).not.toMatch(/background:/);
		expect(rule(".vt-cal-day.vt-cal-day.is-selected")).toMatch(/background:/);
	});
});

describe("ビルド成果物（ADR-0078）", () => {
	const built = (id: string, file: string) => readFileSync(fileURLToPath(new URL(`../../../../../.obsidian/plugins/${id}/${file}`, import.meta.url)), "utf8");

	it.each(["pkm-task", "pkm-template"])("%s の styles.css に共有のカレンダーの CSS が入っている", (id) => {
		expect(built(id, "styles.css")).toContain(readFileSync(fileURLToPath(new URL("../src/month-calendar.css", import.meta.url)), "utf8"));
	});

	it.each(["pkm-task", "pkm-template"])("%s の main.js は preact を 1 つだけ含む（shared からの読み込みで 2 つにならない）", (id) => {
		const copies = built(id, "main.js").match(/^\/\/ .*node_modules\/preact\/dist\/preact\.module\.js$/gm) ?? [];
		expect(copies).toHaveLength(1);
	});
});
