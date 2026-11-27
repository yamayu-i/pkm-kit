import { describe, expect, it } from "vitest";
import { routineSteps, splitDoneRoutines } from "../src/core/board-lanes";

/** ADR-0240: routine の遷移ボタンと、片付いた routine をたたむ */

describe("routine の遷移ボタン（ADR-0240）", () => {
	it("open なら closed と canceled の 2 つ", () => {
		expect(routineSteps("open")).toEqual(["closed", "canceled"]);
	});

	it("closed / canceled なら open に戻す 1 つだけ", () => {
		expect(routineSteps("closed")).toEqual(["reopen"]);
		expect(routineSteps("canceled")).toEqual(["reopen"]);
	});
});

describe("片付いた routine をたたむ（ADR-0240）", () => {
	const items = [
		{ id: "r-1", status: "closed" },
		{ id: "r-2", status: "open" },
		{ id: "r-3", status: "canceled" },
		{ id: "r-4", status: "open" },
	] as const;

	it("open は並びのまま残し、closed / canceled は分けて並びのまま返す", () => {
		const { open, done } = splitDoneRoutines(items, (i) => i.status);
		expect(open.map((i) => i.id)).toEqual(["r-2", "r-4"]);
		expect(done.map((i) => i.id)).toEqual(["r-1", "r-3"]);
	});

	it("片付いたものがなければ done は空", () => {
		const { open, done } = splitDoneRoutines([items[1]], (i) => i.status);
		expect(open).toHaveLength(1);
		expect(done).toEqual([]);
	});
});
