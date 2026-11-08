import { describe, expect, it } from "vitest";
import { prorateEffort } from "../src/core/effort";

const MIN = 60_000;
const at = (m: number) => m * MIN;

function minutes(map: Map<string, number>): Record<string, number> {
	return Object.fromEntries([...map].map(([k, v]) => [k, v / MIN]));
}

describe("prorateEffort", () => {
	it("重ならなければそのまま", () => {
		const r = prorateEffort(
			[
				{ taskId: "i-1", fromMs: at(0), toMs: at(30) },
				{ taskId: "i-2", fromMs: at(30), toMs: at(45) },
			],
			0,
		);
		expect(minutes(r)).toEqual({ "i-1": 30, "i-2": 15 });
	});

	it("重なった区間だけ数で割る（ADR-0005 の例）", () => {
		const r = prorateEffort(
			[
				{ taskId: "A", fromMs: at(0), toMs: at(60) },
				{ taskId: "B", fromMs: at(30), toMs: at(60) },
			],
			0,
		);
		expect(minutes(r)).toEqual({ A: 45, B: 15 });
	});

	it("グループで 3 件同時に再生したら 1/3 ずつ", () => {
		const logs = ["a", "b", "c"].map((taskId) => ({ taskId, fromMs: at(0), toMs: at(60) }));
		expect(minutes(prorateEffort(logs, 0))).toEqual({ a: 20, b: 20, c: 20 });
	});

	it("同じタスクのログが重なっても二重に数えない", () => {
		const r = prorateEffort(
			[
				{ taskId: "A", fromMs: at(0), toMs: at(60) },
				{ taskId: "A", fromMs: at(0), toMs: at(60) },
			],
			0,
		);
		expect(minutes(r)).toEqual({ A: 60 });
	});

	it("動いているログは now まで", () => {
		const r = prorateEffort([{ taskId: "A", fromMs: at(0), toMs: null }], at(25));
		expect(minutes(r)).toEqual({ A: 25 });
	});

	it("長さが 0 以下のログは無視する", () => {
		const r = prorateEffort(
			[
				{ taskId: "A", fromMs: at(10), toMs: at(10) },
				{ taskId: "B", fromMs: at(10), toMs: at(5) },
			],
			0,
		);
		expect(minutes(r)).toEqual({});
	});

	it("合計は重なりを除いた実時間に等しい", () => {
		const logs = [
			{ taskId: "a", fromMs: at(0), toMs: at(50) },
			{ taskId: "b", fromMs: at(10), toMs: at(20) },
			{ taskId: "c", fromMs: at(15), toMs: at(70) },
			{ taskId: "d", fromMs: at(100), toMs: at(110) },
		];
		const total = [...prorateEffort(logs, 0).values()].reduce((s, v) => s + v, 0);
		expect(total / MIN).toBeCloseTo(80);
	});
});
