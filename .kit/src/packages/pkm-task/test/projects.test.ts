import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { emptyVaultData, TaskIndex } from "../src/core/index";
import { parseIssue } from "../src/core/schema";
import { parseSubIssues, type SubIssue } from "../src/core/sub-issue";
import { capacityOn, columnLoad, dayLoad, effectiveEstimates, loadItems, loadLabel, needsBudget, needsEstimate, projectGroups, unallocatedBudget, sizeOf, SIZES, XL_MESSAGE } from "../src/core/projects";

// 2026-11-15 は日曜
const today = "2026-11-16";

const block = (id: string, extra = "") => `<!-- sub-issue\nid: ${id}\nsummary: ${id}\nstatus: open\n${extra}-->\n`;

function issue(id: string, fm: Record<string, unknown> = {}) {
	return parseIssue(`issue/${id}.md`, { type: "issue", id, summary: id, status: "open", clarified: true, ...fm }).value!;
}

function subsOf(parent: string, text: string): SubIssue[] {
	return parseSubIssues(`issue/${parent}.md`, parent, text, parse).subs;
}

describe("Projects の行（ADR-0231）", () => {
	it("closed・canceled でない Project を、期限 → いちばん早い end → ID の順に並べる", () => {
		const data = emptyVaultData();
		data.issues = [issue("i-1"), issue("i-2", { deadline: "2026-12-01" }), issue("i-3"), issue("i-4", { status: "closed" }), issue("i-5"), issue("i-10", { soft_deadline: "2026-11-20" })];
		data.subIssues = [
			...subsOf("i-1", block("aaaaaa")),
			...subsOf("i-2", block("bbbbbb")),
			...subsOf("i-3", block("cccccc", "end: 2026-11-18\n")),
			...subsOf("i-4", block("dddddd")),
			...subsOf("i-10", block("eeeeee")),
		];
		const groups = projectGroups(new TaskIndex(data), false);
		expect(groups.map((g) => g.issue.id)).toEqual(["i-10", "i-2", "i-3", "i-1"]);
	});

	it("閉じたサブは showClosed のときだけ。全部閉じた Project の行は残す", () => {
		const data = emptyVaultData();
		data.issues = [issue("i-1")];
		data.subIssues = subsOf("i-1", block("aaaaaa") + block("bbbbbb").replace("status: open", "status: closed"));
		const index = new TaskIndex(data);
		expect(projectGroups(index, false)[0]!.subs.map((s) => s.id)).toEqual(["aaaaaa"]);
		expect(projectGroups(index, true)[0]!.subs.map((s) => s.id)).toEqual(["aaaaaa", "bbbbbb"]);
		expect(projectGroups(index, false)[0]!.closed).toBe(1);
	});
});

describe("使う見積もり（親の予算の割り振り）", () => {
	it("サブの値があればそれ。なければ親の残りを、見積もりのない閉じていないサブで等分する", () => {
		const parent = issue("i-1", { estimated: 600 });
		const subs = subsOf(
			"i-1",
			block("aaaaaa", "estimated: 120\n") + block("bbbbbb") + block("cccccc") + block("dddddd", "estimated: 60\n").replace("status: open", "status: closed") + block("eeeeee", "estimated: 999\n").replace("status: open", "status: canceled") + block("ffffff").replace("status: open", "status: closed"),
		);
		const est = effectiveEstimates(parent, subs);
		// 残り = 600 − (120 + 60)。canceled は数えない。見積もりのない閉じていないサブは 2 件
		expect(est.get("i-1#aaaaaa")).toEqual({ minutes: 120, source: "sub" });
		expect(est.get("i-1#bbbbbb")).toEqual({ minutes: 210, source: "budget" });
		expect(est.get("i-1#cccccc")).toEqual({ minutes: 210, source: "budget" });
		expect(est.get("i-1#ffffff")).toBeNull();
	});

	it("割り当てていない予算: 親 − canceled 以外のサブの合計。負は割り当てすぎ。親になければ null", () => {
		const subs = subsOf("i-1", block("aaaaaa", "estimated: 120\n") + block("bbbbbb", "estimated: 60\n").replace("status: open", "status: closed") + block("cccccc", "estimated: 999\n").replace("status: open", "status: canceled") + block("dddddd"));
		expect(unallocatedBudget(issue("i-1", { estimated: 600 }), subs)).toBe(420);
		expect(unallocatedBudget(issue("i-1", { estimated: 100 }), subs)).toBe(-80);
		expect(unallocatedBudget(issue("i-1"), subs)).toBeNull();
	});

	it("親に予算がない・残りが 0 以下なら見積もりなし", () => {
		const subs = subsOf("i-1", block("aaaaaa", "estimated: 120\n") + block("bbbbbb"));
		expect(effectiveEstimates(issue("i-1"), subs).get("i-1#bbbbbb")).toBeNull();
		expect(effectiveEstimates(issue("i-1", { estimated: 100 }), subs).get("i-1#bbbbbb")).toBeNull();
	});
});

describe("delegated のサブ（ADR-0247）", () => {
	const delegated = (id: string, extra = "") => block(id, `delegated_to: m-1\n${extra}`).replace("status: open", "status: delegated");

	it("見積もりのない delegated には親の予算を割り振らず、負荷にも未見積もりにも数えない", () => {
		const data = emptyVaultData();
		data.issues = [issue("i-1", { estimated: 600 })];
		data.subIssues = subsOf("i-1", block("aaaaaa", "end: 2026-11-18\n") + delegated("bbbbbb", "end: 2026-11-18\n") + delegated("cccccc", "end: 2026-11-18\nestimated: 30\n"));
		const index = new TaskIndex(data);
		const est = effectiveEstimates(data.issues[0], data.subIssues);
		expect(est.get("i-1#aaaaaa")).toEqual({ minutes: 570, source: "budget" });
		expect(est.get("i-1#bbbbbb")).toBeNull();
		expect(est.get("i-1#cccccc")).toEqual({ minutes: 30, source: "sub" });
		expect(loadItems(projectGroups(index, false), index).map((x) => [x.key, x.minutes])).toEqual([
			["i-1#aaaaaa", 570],
			["i-1#cccccc", 30],
		]);
	});

	it("見積もりのない delegated に Estimate・Budget の印を出さない", () => {
		const subs = subsOf("i-1", delegated("aaaaaa", "start: 2026-11-17\nend: 2026-11-18\n"));
		expect(needsEstimate(subs[0]!, today)).toBe(false);
		expect(needsBudget(issue("i-1"), subs, today)).toBe(false);
	});

	it("estimated が 0 のサブは見積もり済み", () => {
		const subs = subsOf("i-1", block("aaaaaa", "start: 2026-11-17\nend: 2026-11-18\nestimated: 0\n"));
		expect(needsEstimate(subs[0]!, today)).toBe(false);
		expect(effectiveEstimates(issue("i-1", { estimated: 60 }), subs).get("i-1#aaaaaa")).toEqual({ minutes: 0, source: "sub" });
	});
});

describe("負荷の行", () => {
	const cap = { weekday: 360, weekend: 0 };

	it("使える時間は平日と土日で分ける", () => {
		expect(capacityOn("2026-11-16", cap)).toBe(360);
		expect(capacityOn("2026-11-21", cap)).toBe(0);
	});

	it("見積もりを、期間の中の使える時間のある日に等分する。土日だけの期間なら全部の日に", () => {
		const load = dayLoad(
			[
				{ key: "a", start: "2026-11-20", end: "2026-11-23", minutes: 240 },
				{ key: "b", start: "2026-11-21", end: "2026-11-22", minutes: 60 },
				{ key: "c", start: "2026-11-20", end: "2026-11-20", minutes: null },
			],
			cap,
		);
		expect(load.get("2026-11-20")).toEqual({ minutes: 120, unknown: ["c"] });
		expect(load.get("2026-11-21")).toEqual({ minutes: 30, unknown: [] });
		expect(load.get("2026-11-22")).toEqual({ minutes: 30, unknown: [] });
		expect(load.get("2026-11-23")).toEqual({ minutes: 120, unknown: [] });
	});

	it("列（Day は 1 日、Week は 7 日）の合計と、使える時間・未見積もりの件数", () => {
		const load = dayLoad([{ key: "a", start: "2026-11-16", end: "2026-11-17", minutes: 900 }, { key: "b", start: "2026-11-17", end: "2026-11-24", minutes: null }], cap);
		expect(columnLoad(load, "2026-11-16", 1, cap)).toEqual({ minutes: 450, capacity: 360, unknown: 0, over: true });
		expect(columnLoad(load, "2026-11-15", 7, cap)).toEqual({ minutes: 900, capacity: 1800, unknown: 1, over: false });
	});
});

describe("負荷の行の文言", () => {
	it("0.5 時間刻み。未見積もりがあれば ? を付ける。0 は出さない", () => {
		expect(loadLabel(300, 0)).toBe("5h");
		expect(loadLabel(100, 2)).toBe("2h?");
		expect(loadLabel(210, 0)).toBe("4h");
		expect(loadLabel(0, 1)).toBe("?");
		expect(loadLabel(5, 0)).toBe("");
		expect(loadLabel(20, 1)).toBe("?");
	});
});

describe("見積もりのサイズと近いうちの印", () => {
	it("S / M / L は 30m / 2h / 4h。今の値のサイズを返す", () => {
		expect(SIZES.map((s) => [s.label, s.minutes])).toEqual([
			["S", 30],
			["M", 120],
			["L", 240],
		]);
		expect(sizeOf(120)).toBe("M");
		expect(sizeOf(90)).toBeNull();
		expect(sizeOf(null)).toBeNull();
		expect(XL_MESSAGE).toMatch(/分けて/);
	});

	it("閉じていない・見積もりがない・期間が今日から 14 日のうちにかかるサブ", () => {
		const subs = subsOf(
			"i-1",
			block("aaaaaa", "start: 2026-11-29\nend: 2026-12-03\n") +
				block("bbbbbb", "start: 2026-11-30\n") +
				block("cccccc", "start: 2026-11-01\nend: 2026-11-16\n") +
				block("dddddd", "start: 2026-11-01\nend: 2026-11-15\n") +
				block("eeeeee", "end: 2026-11-18\nestimated: 30\n") +
				block("ffffff", "end: 2026-11-18\n").replace("status: open", "status: closed") +
				block("gggggg"),
		);
		expect(subs.filter((s) => needsEstimate(s, today)).map((s) => s.id)).toEqual(["aaaaaa", "cccccc"]);
	});
});

describe("親の予算を促す印（ADR-0231 の追記）", () => {
	it("親に estimated がなく、近いうちの見積もりのないサブがあるときだけ", () => {
		const near = subsOf("i-1", block("aaaaaa", "start: 2026-11-17\nend: 2026-11-18\n"));
		const far = subsOf("i-1", block("aaaaaa", "start: 2027-01-10\n"));
		const estimated = subsOf("i-1", block("aaaaaa", "start: 2026-11-17\nestimated: 30\n"));
		expect(needsBudget(issue("i-1"), near, today)).toBe(true);
		expect(needsBudget(issue("i-1", { estimated: 0 }), near, today)).toBe(false);
		expect(needsBudget(issue("i-1"), far, today)).toBe(false);
		expect(needsBudget(issue("i-1"), estimated, today)).toBe(false);
	});
});
