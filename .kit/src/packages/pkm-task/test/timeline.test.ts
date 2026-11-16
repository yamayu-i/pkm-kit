import { describe, expect, it } from "vitest";
import { arrowMidpoint, barOf, canConnect, dateAtX, incomingOf, roundedPath, routeArrows, dependencyArrows, dragBar, timelineColumns, timelineRange, DAY_PX, type TimelineSub } from "../src/core/timeline";

function s(id: string, extra: Partial<TimelineSub> = {}): TimelineSub {
	return { id, start: null, end: null, scheduled: null, dependsOn: [], ...extra };
}

// 2026-11-15 は日曜
const today = "2026-11-15";

describe("範囲（ADR-0143）", () => {
	it("Day: 日付と今日を含み、前後 2 日。最低 14 日", () => {
		expect(timelineRange([s("a", { start: "2026-11-16", end: "2026-11-20" })], today, "day")).toEqual({ from: "2026-11-13", days: 14 });
		expect(timelineRange([s("a", { start: "2026-11-10", end: "2026-12-10" }), s("b", { scheduled: "2026-12-20" })], today, "day")).toEqual({ from: "2026-11-08", days: 45 });
		expect(timelineRange([], today, "day")).toEqual({ from: "2026-11-13", days: 14 });
	});

	it("Week: 日曜始まり・土曜終わりに広げ、最低 8 週", () => {
		const r = timelineRange([s("a", { start: "2026-11-18", end: "2026-11-20" })], today, "week");
		expect(r).toEqual({ from: "2026-11-08", days: 56 });
		const long = timelineRange([s("a", { start: "2026-11-18", end: "2027-02-10" })], today, "week");
		expect(long.from).toBe("2026-11-08");
		expect(long.days % 7).toBe(0);
		expect(long.days).toBe(98);
	});
});

describe("列の見出し", () => {
	it("Day: 日ごと。範囲の始まりと月の 1 日に月、日曜は週の区切り、土日は週末", () => {
		const cols = timelineColumns({ from: "2026-11-28", days: 5 }, "day");
		expect(cols.map((c) => [c.date, c.label, c.month, c.weekend, c.weekStart, c.span])).toEqual([
			["2026-11-28", "28", "Nov", true, false, 1],
			["2026-11-29", "29", null, true, true, 1],
			["2026-11-30", "30", null, false, false, 1],
			["2026-12-01", "1", "Dec", false, false, 1],
			["2026-12-02", "2", null, false, false, 1],
		]);
	});

	it("Week: 週ごと（日曜の日付）。範囲の始まりと月が変わった週に月", () => {
		const cols = timelineColumns({ from: "2026-11-15", days: 21 }, "week");
		expect(cols.map((c) => [c.date, c.label, c.month, c.span, c.weekStart])).toEqual([
			["2026-11-15", "11/15", "Nov", 7, true],
			["2026-11-22", "11/22", null, 7, true],
			["2026-11-29", "11/29", null, 7, true],
		]);
		expect(timelineColumns({ from: "2026-11-29", days: 14 }, "week").map((c) => c.month)).toEqual(["Nov", "Dec"]);
	});
});

describe("棒と位置", () => {
	it("start〜end。片方だけなら 1 日。逆なら入れ替える。期間がなければ null", () => {
		expect(barOf(s("a", { start: "2026-11-16", end: "2026-11-20" }))).toEqual({ start: "2026-11-16", end: "2026-11-20" });
		expect(barOf(s("a", { start: "2026-11-16" }))).toEqual({ start: "2026-11-16", end: "2026-11-16" });
		expect(barOf(s("a", { end: "2026-11-20" }))).toEqual({ start: "2026-11-20", end: "2026-11-20" });
		expect(barOf(s("a", { start: "2026-11-20", end: "2026-11-16" }))).toEqual({ start: "2026-11-16", end: "2026-11-20" });
		expect(barOf(s("a", { scheduled: "2026-11-16" }))).toBeNull();
	});

	it("x 座標から日付（目盛りの 1 日の幅で）", () => {
		const range = { from: "2026-11-13", days: 14 };
		expect(DAY_PX).toEqual({ day: 28, week: 8 });
		expect(dateAtX(range, 0, "day")).toBe("2026-11-13");
		expect(dateAtX(range, 27, "day")).toBe("2026-11-13");
		expect(dateAtX(range, 28 * 3 + 1, "day")).toBe("2026-11-16");
		expect(dateAtX(range, 8 * 7, "week")).toBe("2026-11-20");
		expect(dateAtX(range, -5, "day")).toBe("2026-11-13");
		expect(dateAtX(range, 9999, "day")).toBe("2026-11-26");
	});
});

describe("ドラッグ", () => {
	const bar = { start: "2026-11-16", end: "2026-11-20" };
	it("真ん中はずらす。両端は片方だけ。start は end を越えない", () => {
		expect(dragBar(bar, "move", 3)).toEqual({ start: "2026-11-19", end: "2026-11-23" });
		expect(dragBar(bar, "move", -2)).toEqual({ start: "2026-11-14", end: "2026-11-18" });
		expect(dragBar(bar, "start", 2)).toEqual({ start: "2026-11-18", end: "2026-11-20" });
		expect(dragBar(bar, "start", 9)).toEqual({ start: "2026-11-20", end: "2026-11-20" });
		expect(dragBar(bar, "end", -9)).toEqual({ start: "2026-11-16", end: "2026-11-16" });
		expect(dragBar(bar, "end", 1)).toEqual({ start: "2026-11-16", end: "2026-11-21" });
	});
});

describe("依存の矢印", () => {
	it("両方に棒があるときだけ。依存先の end より前に始まると遅れ", () => {
		const subs = [
			s("a", { start: "2026-11-16", end: "2026-11-20" }),
			s("b", { start: "2026-11-19", end: "2026-11-22", dependsOn: ["a"] }),
			s("c", { start: "2026-11-21", dependsOn: ["a", "b", "zzzzzz"] }),
			s("d", { scheduled: "2026-11-25", dependsOn: ["a"] }),
		];
		expect(dependencyArrows(subs)).toEqual([
			{ from: "a", to: "b", late: true },
			{ from: "a", to: "c", late: false },
			{ from: "b", to: "c", late: true },
		]);
	});
});

describe("矢印の経路（重ならない工夫）", () => {
	const ROW = 36;
	type Pt = [number, number];
	type Bar = { x0: number; x1: number } | null;

	/** 線分が、始まりと終わり以外の棒（行の上下 8px の空きを除いた面）を横切るか */
	function crossings(points: Pt[], bars: Bar[], skip: number[]): string[] {
		const out: string[] = [];
		for (let i = 1; i < points.length; i++) {
			const [ax, ay] = points[i - 1]!;
			const [bx, by] = points[i]!;
			bars.forEach((b, row) => {
				if (!b || skip.includes(row)) return;
				const top = row * ROW + 8;
				const bottom = row * ROW + 28;
				const hit = Math.max(Math.min(ax, bx), b.x0) < Math.min(Math.max(ax, bx), b.x1) || (ax === bx && ax > b.x0 && ax < b.x1);
				const vHit = Math.max(Math.min(ay, by), top) < Math.min(Math.max(ay, by), bottom) || (ay === by && ay > top && ay < bottom);
				if (hit && vHit) out.push(`segment ${i} crosses row ${row}`);
			});
		}
		return out;
	}
	/** 始まりと終わりの棒も、横切ってはいけない（出る・入るの端の点だけ触れてよい） */
	function touchesOwnBars(points: Pt[], bars: Bar[], from: number, to: number): boolean {
		const inner = points.slice(1, -1);
		return inner.some(([x, y]) => [from, to].some((row) => {
			const b = bars[row]!;
			return x > b.x0 && x < b.x1 && y > row * ROW + 8 && y < row * ROW + 28;
		}));
	}

	it("間が空いていて途中に棒がなければ、依存するサブの棒の手前で縦に折れて、左から入る", () => {
		const bars: Bar[] = [{ x0: 20, x1: 100 }, null, { x0: 200, x1: 260 }];
		expect(routeArrows([{ fromRow: 0, toRow: 2 }], bars, ROW)).toEqual([
			[
				[100, 18],
				[192, 18],
				[192, 90],
				[200, 90],
			],
		]);
	});

	it("途中の行に棒があれば、その棒をよけた縦の通り道を使う", () => {
		const bars: Bar[] = [{ x0: 20, x1: 100 }, { x0: 150, x1: 240 }, { x0: 200, x1: 260 }];
		const [route] = routeArrows([{ fromRow: 0, toRow: 2 }], bars, ROW);
		expect(crossings(route!, bars, [0, 2])).toEqual([]);
		expect(route![route!.length - 1]).toEqual([200, 90]);
		expect(route![route!.length - 2]![1]).toBe(90);
		expect(route![route!.length - 2]![0]).toBeLessThan(200);
	});

	it("遅れ（始まりが依存先の終わりより前）は、行の間の隙間を通って戻り、左から入る。棒の上を横切らない", () => {
		const bars: Bar[] = [{ x0: 20, x1: 200 }, { x0: 100, x1: 220 }, { x0: 120, x1: 180 }];
		const routes = routeArrows([{ fromRow: 0, toRow: 2 }, { fromRow: 2, toRow: 0 }], bars, ROW);
		for (const [i, [from, to]] of [[0, 2], [2, 0]].entries()) {
			const r = routes[i]!;
			expect(crossings(r, bars, [from!, to!])).toEqual([]);
			expect(touchesOwnBars(r, bars, from!, to!)).toBe(false);
			expect(r[0]).toEqual([bars[from!]!.x1, from! * ROW + 18]);
			expect(r[r.length - 1]).toEqual([bars[to!]!.x0, to! * ROW + 18]);
			// 最後は左から入る
			expect(r[r.length - 2]![0]).toBeLessThan(bars[to!]!.x0);
		}
	});

	it("入り組んでも、どの矢印も途中の棒を横切らず、縦の線どうし・横の線どうしが重ならない", () => {
		// プレビューに近い形: 1 本の棒から 4 本出る、1 本の棒に 3 本入る、遅れが混ざる
		const bars: Bar[] = [
			{ x0: 56, x1: 168 },
			null,
			null,
			{ x0: 168, x1: 336 },
			{ x0: 252, x1: 756 },
			{ x0: 84, x1: 224 },
			{ x0: 336, x1: 420 },
		];
		const arrows = [
			{ fromRow: 0, toRow: 3 },
			{ fromRow: 3, toRow: 4 },
			{ fromRow: 0, toRow: 4 },
			{ fromRow: 0, toRow: 5 },
			{ fromRow: 5, toRow: 6 },
			{ fromRow: 3, toRow: 6 },
			{ fromRow: 0, toRow: 6 },
		];
		const routes = routeArrows(arrows, bars, ROW);
		const verticals: { x: number; y0: number; y1: number; i: number }[] = [];
		const horizontals: { y: number; x0: number; x1: number; i: number }[] = [];
		routes.forEach((r, i) => {
			expect(crossings(r, bars, [arrows[i]!.fromRow, arrows[i]!.toRow])).toEqual([]);
			expect(touchesOwnBars(r, bars, arrows[i]!.fromRow, arrows[i]!.toRow)).toBe(false);
			for (let k = 1; k < r.length; k++) {
				const [ax, ay] = r[k - 1]!;
				const [bx, by] = r[k]!;
				if (ax === bx) verticals.push({ x: ax, y0: Math.min(ay, by), y1: Math.max(ay, by), i });
				else horizontals.push({ y: ay, x0: Math.min(ax, bx), x1: Math.max(ax, bx), i });
			}
		});
		// 別の矢印の縦の線が、同じ x で縦に重なっていない（同じ棒から出る最初の区間と、入る最後の区間は除く）
		for (const a of verticals)
			for (const b of verticals) {
				if (a.i >= b.i) continue;
				const sameStart = arrows[a.i]!.fromRow === arrows[b.i]!.fromRow;
				const sameEnd = arrows[a.i]!.toRow === arrows[b.i]!.toRow;
				if (Math.abs(a.x - b.x) < 3 && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > 1 && !sameStart && !sameEnd) {
					throw new Error(`vertical overlap ${a.i} ${b.i} at x=${a.x}`);
				}
			}
		// 行の間の隙間を通る横の線どうしが重なっていない
		for (const a of horizontals)
			for (const b of horizontals) {
				if (a.i >= b.i || (a.y % ROW !== 0 && Math.abs((a.y % ROW) - 18) < 1)) continue;
				const onBand = (y: number) => Math.abs(y - Math.round(y / ROW) * ROW) <= 8;
				if (!onBand(a.y) || !onBand(b.y)) continue;
				if (Math.abs(a.y - b.y) < 2 && Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > 1) throw new Error(`band overlap ${a.i} ${b.i} at y=${a.y}`);
			}
	});

	it("角を丸めた SVG の path", () => {
		expect(roundedPath([[0, 0], [20, 0], [20, 20], [40, 20]], 4)).toBe("M0 0 L16 0 Q20 0 20 4 L20 16 Q20 20 24 20 L40 20");
		// 短い区間は、半分までしか丸めない
		expect(roundedPath([[0, 0], [4, 0], [4, 10]], 4)).toBe("M0 0 L2 0 Q4 0 4 2 L4 10");
		expect(roundedPath([[0, 0], [10, 0]], 4)).toBe("M0 0 L10 0");
	});
});

describe("ホバー・フォーカスで強調するもの", () => {
	const arrows = [
		{ from: "a", to: "b", late: false },
		{ from: "a", to: "c", late: false },
		{ from: "b", to: "c", late: true },
	];
	it("その棒に入る矢印と、依存先の棒。入る矢印がなければ何も強調しない", () => {
		expect(incomingOf(arrows, "c")).toEqual({ arrows: [1, 2], from: ["a", "b"] });
		expect(incomingOf(arrows, "b")).toEqual({ arrows: [0], from: ["a"] });
		expect(incomingOf(arrows, "a")).toBeNull();
		expect(incomingOf(arrows, null)).toBeNull();
	});
});

describe("依存を引く・消す（ADR-0163）", () => {
	const bar = (id: string, dependsOn: string[] = [], start: string | null = "2026-11-16") => s(id, { start, end: start, dependsOn });

	it("棒のある別のサブで、まだつないでおらず、循環にならなければつなげる", () => {
		const subs = [bar("a"), bar("b"), bar("c")];
		expect(canConnect(subs, "a", "b")).toBe(true);
	});

	it("自分自身・すでにある依存・棒のないサブにはつなげない", () => {
		const subs = [bar("a"), bar("b", ["a"]), bar("c", [], null)];
		expect(canConnect(subs, "a", "a")).toBe(false);
		expect(canConnect(subs, "a", "b")).toBe(false);
		expect(canConnect(subs, "a", "c")).toBe(false);
		expect(canConnect(subs, "c", "a")).toBe(false);
		expect(canConnect(subs, "a", "zzz")).toBe(false);
	});

	it("循環になるつなぎ方はできない（直接も、間にサブをはさんでも）", () => {
		const subs = [bar("a"), bar("b", ["a"]), bar("c", ["b"])];
		expect(canConnect(subs, "b", "a")).toBe(false);
		expect(canConnect(subs, "c", "a")).toBe(false);
		expect(canConnect(subs, "a", "c")).toBe(true);
	});

	it("矢印の中ほどの点（× ボタンの位置）は、折れ線の真ん中あたりの区間の中点", () => {
		expect(arrowMidpoint([[0, 0], [10, 0]])).toEqual([5, 0]);
		expect(arrowMidpoint([[0, 0], [10, 0], [10, 20], [30, 20]])).toEqual([10, 10]);
		expect(arrowMidpoint([[0, 0], [10, 0], [10, 20]])).toEqual([10, 10]);
	});
});
