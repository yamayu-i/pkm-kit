import { describe, expect, it } from "vitest";
import { STATUSES, type Status } from "../src/core/schema";
import type { StatusLogEntry } from "../src/core/status-log";
import {
	canApplyAll,
	canSetTickler,
	canTransition,
	canTransitionAll,
	issueStatusPatch,
	primaryStep,
	reopenStatus,
	stopsTimer,
	reopenSubOnPeriod,
	subStatusPatch,
	timerStartStatus,
	transitionError,
	transitionTargets,
	unstarsOn,
} from "../src/core/transition";

/** ADR-0183 の遷移表（テストの側にも書き写し、表の変更を検出する） */
const TABLE: Record<Status, Status[]> = {
	open: ["in-progress", "waiting", "delegated", "someday", "closed", "canceled"],
	"in-progress": ["waiting", "delegated", "someday", "closed", "canceled"],
	waiting: ["in-progress", "someday", "closed", "canceled"],
	delegated: ["in-progress", "someday", "closed", "canceled"],
	someday: ["open", "closed", "canceled"],
	closed: ["canceled"],
	canceled: ["closed"],
};

const pairs = STATUSES.flatMap((from) => STATUSES.map((to) => [from, to] as const));
const DATE_KEYS = ["soft_deadline", "deadline"] as const;

describe("遷移表", () => {
	it.each(pairs)("%s → %s は表のとおり許す・拒む", (from, to) => {
		expect(canTransition(from, to)).toBe(TABLE[from].includes(to));
	});

	it.each(STATUSES)("%s の移れる先は STATUSES の順", (from) => {
		expect(transitionTargets(from)).toEqual(STATUSES.filter((s) => TABLE[from].includes(s)));
	});

	it("in-progress から open には戻らない。waiting と delegated の間は直接移らない", () => {
		expect(canTransition("in-progress", "open")).toBe(false);
		expect(canTransition("waiting", "delegated")).toBe(false);
		expect(canTransition("delegated", "waiting")).toBe(false);
		expect(canTransition("waiting", "open")).toBe(false);
	});

	it("closed / canceled からは、表の先と ↩ の戻る先だけに移れる", () => {
		expect(canTransition("closed", "in-progress")).toBe(false);
		expect(canTransition("closed", "in-progress", "in-progress")).toBe(true);
		expect(canTransition("canceled", "waiting", "waiting")).toBe(true);
		expect(canTransition("closed", "open", "in-progress")).toBe(false);
		// 終わっていないものの ↩ は使わない
		expect(canTransition("open", "someday", null)).toBe(true);
		expect(canTransition("in-progress", "open", "open")).toBe(false);
	});

	it("拒んだときの文に移れる先を書く", () => {
		expect(transitionError("waiting", "open")).toContain("in-progress, someday, closed, canceled");
		expect(transitionError("closed", "open", "in-progress")).toContain("in-progress（Reopen）");
	});

	it("一括の操作は、1 つでも移れなければ押せない", () => {
		expect(canTransitionAll(["open", "in-progress"], "closed")).toBe(true);
		expect(canTransitionAll(["open", "closed"], "closed")).toBe(false);
		expect(canTransitionAll(["open", "in-progress"], "open")).toBe(false);
		expect(canTransitionAll([], "closed")).toBe(false);
	});
});

describe("ボタン", () => {
	it.each(STATUSES)("%s のボタンは表で移れる 1 つ（終わったものは ↩）", (status) => {
		const step = primaryStep(status);
		if (step.kind === "status") expect(canTransition(status, step.to)).toBe(true);
		else expect(["closed", "canceled"]).toContain(status);
	});

	it("よく使う遷移を選ぶ", () => {
		expect(primaryStep("open")).toMatchObject({ to: "in-progress", label: "Start" });
		expect(primaryStep("in-progress")).toMatchObject({ to: "closed", label: "Close" });
		expect(primaryStep("waiting")).toMatchObject({ to: "in-progress", label: "Resume" });
		expect(primaryStep("delegated")).toMatchObject({ to: "in-progress", label: "Resume" });
		expect(primaryStep("someday")).toMatchObject({ to: "open" });
		expect(primaryStep("closed").kind).toBe("reopen");
	});
});

describe("↩ の戻る先", () => {
	let n = 0;
	const log = (task: string, from: Status, to: Status, sub: string | null = null): StatusLogEntry => ({
		path: "statuslog/pc/2026-11.jsonl",
		line: n,
		id: `st_${n}`,
		at: "",
		atMs: n++,
		task,
		sub,
		from,
		to,
		via: "ui",
	});

	it("最後に閉じたときの from に戻る。closed と canceled を行き来しても閉じる前に戻る", () => {
		const logs = [log("i-1", "open", "in-progress"), log("i-1", "in-progress", "closed"), log("i-1", "closed", "canceled")];
		expect(reopenStatus(logs, "i-1")).toBe("in-progress");
	});

	it("分からなければ open。サブと issue の記録を混ぜない", () => {
		const logs = [log("i-1", "waiting", "closed", "aaaaaa")];
		expect(reopenStatus(logs, "i-1")).toBe("open");
		expect(reopenStatus(logs, "i-1", "aaaaaa")).toBe("waiting");
	});
});

describe("付随の変更", () => {
	const patchOf = (to: Status) => issueStatusPatch(to, { delegatedTo: "m-1" });

	it.each(STATUSES)("issue を %s にすると、表のとおりの項目を消す", (to) => {
		const p = patchOf(to);
		expect(p.status).toBe(to);
		// delegated_to は delegated のときだけ
		expect(p.delegated_to).toBe(to === "delegated" ? "m-1" : null);
		// revisit は someday のときだけ（任意）
		expect(p.revisit).toBeNull();
		// tickler は open だけが持つ（open では残し、ほかでは消す）
		if (to === "open") expect("tickler" in p).toBe(false);
		else expect(p.tickler).toBeNull();
		// 期限は someday と canceled で消す
		for (const k of DATE_KEYS) {
			if (to === "someday" || to === "canceled") expect(p[k]).toBeNull();
			else expect(k in p).toBe(false);
		}
		// scheduled は someday で消す
		if (to === "someday") expect(p.scheduled).toBeNull();
		else expect("scheduled" in p).toBe(false);
	});

	it("someday の revisit は入れられる。delegated には委任先が要る", () => {
		expect(issueStatusPatch("someday", { revisit: "2026-12-01" }).revisit).toBe("2026-12-01");
		expect(() => issueStatusPatch("delegated")).toThrow();
		expect(() => subStatusPatch("delegated")).toThrow();
	});

	it.each(STATUSES)("サブを %s にすると、someday だけ Calendar の日と期間を消す（ADR-0190）", (to) => {
		const p = subStatusPatch(to, { delegatedTo: "m-1" });
		expect(p.status).toBe(to);
		expect(p.delegatedTo).toBe(to === "delegated" ? "m-1" : null);
		for (const k of ["scheduled", "start", "end"] as const) {
			if (to === "someday") expect(p[k]).toBeNull();
			else expect(k in p).toBe(false);
		}
	});

	it("someday のサブに期間を入れると open に戻す。status を同時に変えるなら、その status を使う（ADR-0190）", () => {
		expect(reopenSubOnPeriod("someday", { end: "2026-12-01" })).toEqual({ end: "2026-12-01", status: "open" });
		expect(reopenSubOnPeriod("someday", { start: "2026-12-01", end: "2026-12-03" }).status).toBe("open");
		expect(reopenSubOnPeriod("someday", { start: null, end: null })).toEqual({ start: null, end: null });
		expect(reopenSubOnPeriod("someday", { end: "2026-12-01", status: "canceled" }).status).toBe("canceled");
		expect(reopenSubOnPeriod("open", { end: "2026-12-01" })).toEqual({ end: "2026-12-01" });
		expect(reopenSubOnPeriod("someday", { summary: "x" })).toEqual({ summary: "x" });
	});

	it("タイマーは open / in-progress 以外で止め、★ は待ち・someday で外す", () => {
		expect(STATUSES.filter(stopsTimer)).toEqual(["waiting", "delegated", "someday", "closed", "canceled"]);
		expect(STATUSES.filter(unstarsOn)).toEqual(["waiting", "delegated", "someday"]);
	});

	it("タイマーを始めたら open・waiting・delegated を in-progress にする", () => {
		expect(STATUSES.map(timerStartStatus)).toEqual(STATUSES.map((s) => (s === "open" || s === "waiting" || s === "delegated" ? "in-progress" : null)));
		for (const s of STATUSES) {
			const to = timerStartStatus(s);
			if (to) expect(canTransition(s, to)).toBe(true);
		}
	});
});

describe("Tickler は open だけ（ADR-0183）", () => {
	it("付けられるのは open と someday（someday は open に戻る）", () => {
		expect(STATUSES.filter(canSetTickler)).toEqual(["open", "someday"]);
	});
	it("一括の Tickler は、1 つでも付けられないものがあれば押せない", () => {
		expect(canApplyAll(["open", "someday"], "tickler")).toBe(true);
		expect(canApplyAll(["open", "in-progress"], "tickler")).toBe(false);
		expect(canApplyAll([], "tickler")).toBe(false);
	});
});
