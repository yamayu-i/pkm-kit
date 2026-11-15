import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { emptyBoard } from "../src/core/board";
import { cautionSubs, currentStep, deadSubs, pickCandidates } from "../src/core/daily";
import { TaskIndex } from "../src/core/index";
import { collectVault } from "../src/core/load";

/** ADR-0150: DailyTaskView を GTD の Engage に合わせる（Calendar・Previous boards・Pick・Board） */

const today = "2026-11-16";
const sub = (id: string, summary: string, extra = "") => `<!-- sub-issue\nid: ${id}\nsummary: ${summary}\nstatus: open\n${extra}-->\n\n`;
function issue(id: string, fm: Record<string, unknown>, subs = "") {
	const frontmatter = { type: "issue", id, summary: `題${id}`, status: "open", ...fm };
	return { path: `issue/${id}.md`, frontmatter, text: `---\n---\n${subs}` };
}
const indexOf = (markdown: ReturnType<typeof issue>[]) => new TaskIndex(collectVault({ markdown, worklogs: [], labels: null, parseYaml: parse }).data);

describe("段階の選び方", () => {
	const steps = ["calendar", "previous", "pick", "board"] as const;
	it("件数のある段階を順に通り、飛ばした段階は過ぎる。どれもなければ Board", () => {
		expect(currentStep(steps, { calendar: 2, previous: 1, pick: 3, board: 0 }, new Set(), null)).toBe("calendar");
		expect(currentStep(steps, { calendar: 2, previous: 1, pick: 3, board: 0 }, new Set(["calendar"]), null)).toBe("previous");
		expect(currentStep(steps, { calendar: 0, previous: 0, pick: 3, board: 0 }, new Set(), null)).toBe("pick");
		expect(currentStep(steps, { calendar: 0, previous: 0, pick: 0, board: 5 }, new Set(), null)).toBe("board");
	});

	it("手で選んだ段階を出す。片付いたら（件数 0）次の段階へ進む。特例はない", () => {
		expect(currentStep(steps, { calendar: 2, previous: 0, pick: 3, board: 0 }, new Set(), "pick")).toBe("pick");
		expect(currentStep(steps, { calendar: 0, previous: 0, pick: 0, board: 0 }, new Set(), "calendar")).toBe("board");
		expect(currentStep(steps, { calendar: 0, previous: 0, pick: 0, board: 0 }, new Set(), "board")).toBe("board");
	});
});

describe("サブの期限（Calendar の段階）", () => {
	it("期限切れ・期限が近いサブを、deadline と soft_deadline に分けて返す", () => {
		const index = indexOf([
			issue("i-1", {}, sub("aaaaaa", "過ぎた", "deadline: 2026-11-10\n") + sub("bbbbbb", "近い", "soft_deadline: 2026-11-18\n") + sub("cccccc", "先", "deadline: 2026-12-01\n")),
			issue("i-2", { status: "closed" }, sub("dddddd", "閉じた親", "deadline: 2026-11-10\n")),
		]);
		expect(deadSubs(index, today).deadline.map((s) => s.key)).toEqual(["i-1#aaaaaa", "i-2#dddddd"]);
		expect(cautionSubs(index, today).softDeadline.map((s) => s.key)).toEqual(["i-1#bbbbbb"]);
		expect(cautionSubs(index, today).deadline).toEqual([]);
	});
});

describe("Pick の候補", () => {
	const index = indexOf([
		issue("i-1", { clarified: true, priority: "low" }),
		issue("i-2", { clarified: true, priority: "high", deadline: "2026-11-20" }),
		issue("i-3", { clarified: true, priority: "high", deadline: "2026-11-18" }),
		issue("i-4", {}), // Inbox
		issue("i-5", { clarified: true, scheduled: "2026-11-20" }), // Calendar
		issue("i-6", { clarified: true, tickler: "2026-11-20" }), // Tickler
		issue("i-7", { clarified: true, priority: "mid" }, sub("aaaaaa", "先にやる") + sub("bbbbbb", "あとで", "start: 2026-11-30\n") + sub("cccccc", "決まった日", "scheduled: 2026-11-20\n") + sub("dddddd", "次に")),
		issue("i-8", { clarified: true, priority: "mid", reviewed: "2026-10-01" }),
		issue("i-9", { status: "waiting", priority: "high" }, sub("eeeeee", "待っている親のサブ")),
	]);

	it("Next の issue を priority → deadline → 見直しが古い順に並べる。Inbox・Calendar・Tickler は出さない", () => {
		const { issues } = pickCandidates(index, today, emptyBoard());
		expect(issues.map((i) => i.id)).toEqual(["i-3", "i-2", "i-8", "i-1"]);
	});

	it("サブを持つ親は行に出さず、サブの見出しにする（親の priority の順、サブは親の中の順）。start が先のサブと Calendar のサブは出さない", () => {
		const { issues, groups } = pickCandidates(index, today, emptyBoard());
		expect(issues.map((i) => i.id)).not.toContain("i-7");
		expect(groups.map((g) => [g.parent.id, g.subs.map((s) => s.id)])).toEqual([
			["i-9", ["eeeeee"]],
			["i-7", ["aaaaaa", "dddddd"]],
		]);
	});

	it("親が active でない（closed・someday など）サブは出さない", () => {
		const idx = indexOf([issue("i-1", { status: "someday" }, sub("aaaaaa", "s")), issue("i-2", { status: "closed" }, sub("bbbbbb", "t"))]);
		expect(pickCandidates(idx, today, emptyBoard()).groups).toEqual([]);
	});

	it("今日のボードにあるものは出さない", () => {
		const board = { ...emptyBoard(), issues: ["i-3", "i-7#aaaaaa"] };
		const { issues, groups } = pickCandidates(index, today, board);
		expect(issues.map((i) => i.id)).toEqual(["i-2", "i-8", "i-1"]);
		expect(groups.find((g) => g.parent.id === "i-7")?.subs.map((s) => s.id)).toEqual(["dddddd"]);
	});
});
