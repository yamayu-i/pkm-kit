import { describe, expect, it } from "vitest";
import { PAGE_SIZE, totalRows, visibleSections } from "../src/core/paging";
import type { Section } from "../src/core/sections";

const section = (id: Section["id"], n: number): Section => ({
	id,
	title: id,
	command: `x:${id}`,
	items: Array.from({ length: n }, (_, i) => ({ path: `${id}/${i}.md`, title: String(i), updatedMs: 0 })),
});

describe("無限スクロール（ADR-0070 の 3）", () => {
	it("50 行ずつ。セクションをまたいで数える", () => {
		expect(PAGE_SIZE).toBe(50);
		const all = [section("issues", 30), section("inbox", 30), section("notes", 5)];
		expect(totalRows(all)).toBe(65);
		const first = visibleSections(all, PAGE_SIZE);
		expect(first.map((s) => [s.id, s.items.length])).toEqual([
			["issues", 30],
			["inbox", 20],
		]);
		expect(visibleSections(all, 100).map((s) => s.items.length)).toEqual([30, 30, 5]);
		expect(visibleSections(all, 0)).toEqual([]);
	});

	it("0 件のセクションは常に残す", () => {
		const all = [section("issues", 30), section("inbox", 0), section("notes", 30), section("sources", 0)];
		expect(visibleSections(all, 20).map((s) => [s.id, s.items.length])).toEqual([
			["issues", 20],
			["inbox", 0],
			["sources", 0],
		]);
		expect(visibleSections([section("issues", 0)], 0).map((s) => s.id)).toEqual(["issues"]);
	});
});
