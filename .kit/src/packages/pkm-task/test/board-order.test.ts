import { describe, expect, it } from "vitest";
import { nextOrder, reorder, sortByOrder } from "../src/core/board";

/** ADR-0114: カードを手で並べ替える */

describe("並び（ADR-0114。ADR-0137 で 1 つの並びにした。読み取りと決め方は board-lanes.test.ts）", () => {
	it("並びにあるものはその順、ないものはこれまでの順で末尾", () => {
		const items = ["i-1", "i-2", "i-3", "r-1", "r-2"];
		expect(sortByOrder(items, (x) => x, ["r-1", "i-3", "i-9"])).toEqual(["r-1", "i-3", "i-1", "i-2", "r-2"]);
		expect(sortByOrder(items, (x) => x, undefined)).toEqual(items);
	});
});

describe("書く並び", () => {
	it("動かしたカードを、指したカードの前か末尾に入れる", () => {
		expect(reorder(["a", "b", "c"], "c", "a")).toEqual(["c", "a", "b"]);
		expect(reorder(["a", "b", "c"], "a", null)).toEqual(["b", "c", "a"]);
		// 別のグループから来たカード
		expect(reorder(["a", "b"], "x", "b")).toEqual(["a", "x", "b"]);
		expect(reorder(["a", "b"], "x", null)).toEqual(["a", "b", "x"]);
		// 指したカードがないときは末尾
		expect(reorder(["a", "b"], "a", "zz")).toEqual(["b", "a"]);
	});

	it("今日は出ていない ID を、前の並びで直前にあった ID の後ろに残す", () => {
		// r-w（週 1 の routine）は今日は出ていない
		expect(nextOrder(["i-2", "i-1"], ["i-1", "r-w", "i-2"])).toEqual(["i-2", "i-1", "r-w"]);
		expect(nextOrder(["i-1", "i-2"], ["r-w", "i-1", "i-2"])).toEqual(["r-w", "i-1", "i-2"]);
		expect(nextOrder(["i-1", "i-2"], ["i-1", "r-w", "r-x", "i-2"])).toEqual(["i-1", "r-w", "r-x", "i-2"]);
		expect(nextOrder(["i-1", "i-2"], undefined)).toEqual(["i-1", "i-2"]);
	});
});
