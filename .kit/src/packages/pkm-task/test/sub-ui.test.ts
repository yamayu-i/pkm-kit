import { describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { parse } from "yaml";
import { TaskIndex } from "../src/core/index";
import { collectVault } from "../src/core/load";
import { parseStatusLog } from "../src/core/status-log";
import {
	dropPosition,
	parseSubIssues,
	splitQuickAdd,
	cursorInsideSubArea,
	isSubOpen,
	sanitizeSubOpen,
	stepPosition,
	subAreaOffset,
	subAreaRole,
	subAreaStartLine,
	toggleSubOpen,
	subCounts,
	subHint,
	visibleSubs,
	type SubIssue,
} from "../src/core/sub-issue";
import type { TaskStore } from "../src/obsidian/store";
import { TaskWriter } from "../src/obsidian/writer";

vi.mock("obsidian", async () => {
	const yaml = await import("yaml");
	return { TFile: class {}, normalizePath: (path: string) => path, parseYaml: yaml.parse };
});

const HEAD = "---\ntype: issue\nid: i-1\nsummary: 親\nstatus: open\n---\n\n## Note\n\n親の本文\n";
const block = (id: string, extra = "") => `<!-- sub-issue\nid: ${id}\nsummary: ${id}\nstatus: open\n${extra}-->\n`;
const subsOf = (text: string) => parseSubIssues("issue/i-1.md", "i-1", text, parse).subs;

function sub(extra: string): SubIssue {
	return subsOf(`${HEAD}\n${block("aaaaaa", extra)}`)[0]!;
}

describe("行の補足（ADR-0142）", () => {
	const today = "2026-11-15";
	it("期間 → 次の予定日 → 期限の順", () => {
		expect(subHint(sub("start: 2026-11-16\nend: 2026-11-20\nscheduled: 2026-11-17\n"), today)).toBe("11/16–11/20");
		expect(subHint(sub("end: 2026-11-20\n"), today)).toBe("–11/20");
		expect(subHint(sub("start: 2026-11-16\n"), today)).toBe("11/16–");
		expect(subHint(sub("scheduled: 2026-11-18\ndeadline: 2026-11-30\n"), today)).toBe("11/18");
		// 過ぎた Calendar の日は出さず、期限を出す
		expect(subHint(sub("scheduled: 2026-11-10\ndeadline: 2026-11-30\n"), today)).toBe("Due 11/30");
		expect(subHint(sub("soft_deadline: 2026-11-25\n"), today)).toBe("Due 11/25");
		expect(subHint(sub(""), today)).toBeNull();
	});
});

describe("出す行と件数", () => {
	const subs = subsOf(`${HEAD}\n${block("aaaaaa")}${block("bbbbbb").replace("open", "closed")}${block("cccccc").replace("open", "canceled")}${block("dddddd").replace("open", "waiting")}`);
	it("closed と canceled は既定で出さない。件数は 未完了 / 全体", () => {
		expect(visibleSubs(subs, false).map((s) => s.id)).toEqual(["aaaaaa", "dddddd"]);
		expect(visibleSubs(subs, true).map((s) => s.id)).toEqual(["aaaaaa", "bbbbbb", "cccccc", "dddddd"]);
		expect(subCounts(subs)).toEqual({ open: 2, total: 4, closed: 2 });
	});
});

describe("移す位置（md の並び。隠した行と読めないブロックを含む）", () => {
	// a, (読めない), b, c(closed で隠れている), d
	const ids = ["aaaaaa", null, "bbbbbb", "cccccc", "dddddd"];
	it("ドラッグ: 落とした行の前に置く。最後なら末尾。変わらなければ null", () => {
		expect(dropPosition(ids, "dddddd", "bbbbbb")).toBe(2);
		expect(dropPosition(ids, "aaaaaa", "dddddd")).toBe(3);
		expect(dropPosition(ids, "aaaaaa", null)).toBe(4);
		expect(dropPosition(ids, "bbbbbb", "cccccc")).toBeNull();
		expect(dropPosition(ids, "dddddd", null)).toBeNull();
	});

	it("Move up / down: 出ている隣の行をまたぐ", () => {
		const visible = ["aaaaaa", "bbbbbb", "dddddd"];
		expect(stepPosition(ids, visible, "dddddd", -1)).toBe(2);
		expect(stepPosition(ids, visible, "bbbbbb", 1)).toBe(4);
		expect(stepPosition(ids, visible, "aaaaaa", -1)).toBeNull();
		expect(stepPosition(ids, visible, "dddddd", 1)).toBeNull();
	});
});

describe("素早い追加", () => {
	it("空でない行ごとに 1 件。前後の空白を除く", () => {
		expect(splitQuickAdd("  仕様を決める  ")).toEqual(["仕様を決める"]);
		expect(splitQuickAdd("a\r\n\n  b\n- c\n")).toEqual(["a", "b", "- c"]);
		expect(splitQuickAdd("  \n")).toEqual([]);
	});
});

describe("リーディング表示で隠す行", () => {
	it("frontmatter の後ろの、最初のマーカーの行（0 から）。なければ null", () => {
		const text = `${HEAD}\n${block("aaaaaa")}`;
		expect(subAreaStartLine(text)).toBe(text.split("\n").indexOf("<!-- sub-issue"));
		expect(subAreaStartLine(HEAD)).toBeNull();
		expect(subAreaStartLine("---\nx: \"<!-- sub-issue\"\n---\n")).toBeNull();
	});
});

/** issue の md をメモリに持つ Vault（writer のサブの操作を確かめる） */
function fixture(text: string) {
	const texts = new Map<string, string>([["issue/i-1.md", text]]);
	const store = {
		get index() {
			const markdown = [...texts]
				.filter(([p]) => p.startsWith("issue/"))
				.map(([path, t]) => ({ path, text: t, frontmatter: parse(/^---\n([\s\S]*?)\n---/.exec(t)![1]!) as Record<string, unknown> }));
			const worklogs = [...texts].filter(([p]) => p.startsWith("worklog/")).map(([path, t]) => ({ path, text: t }));
			return new TaskIndex(collectVault({ markdown, worklogs, labels: null, parseYaml: parse }).data);
		},
		refreshSoon: vi.fn(),
	} as unknown as TaskStore;
	const vault = {
		getFileByPath: (path: string) => (texts.has(path) ? { path } : null),
		getFolderByPath: () => ({}),
		createFolder: vi.fn(),
		create: vi.fn(async (path: string, t: string) => {
			texts.set(path, t);
			return { path };
		}),
		process: vi.fn(async (file: { path: string }, edit: (t: string) => string) => {
			texts.set(file.path, edit(texts.get(file.path) ?? ""));
		}),
	};
	const app = { vault, fileManager: {} } as unknown as App;
	const writer = new TaskWriter(app, store, () => "pc");
	return { writer, texts, store, subs: () => subsOf(texts.get("issue/i-1.md")!), text: () => texts.get("issue/i-1.md")! };
}

describe("writer のサブの操作", () => {
	it("続けて作ると、その順に末尾に足し、合成キーを返す。親の本文は変えない", async () => {
		const f = fixture(HEAD);
		const first = await f.writer.createSubs("i-1", ["仕様"]);
		const next = await f.writer.createSubs("i-1", ["実装", "確認"]);
		expect(first).toHaveLength(1);
		expect(next).toHaveLength(2);
		expect(f.subs().map((s) => [s.key, s.summary, s.status])).toEqual([
			[first[0], "仕様", "open"],
			[next[0], "実装", "open"],
			[next[1], "確認", "open"],
		]);
		expect(f.subs().every((s) => s.created !== null)).toBe(true);
		expect(f.text().startsWith(HEAD)).toBe(true);
		await expect(f.writer.createSubs("i-1", ["a --> b"])).rejects.toThrow();
		expect(f.subs()).toHaveLength(3);
	});

	it("移す・消す。依存されているサブは消せない", async () => {
		const f = fixture(`${HEAD}\n${block("aaaaaa")}\n${block("bbbbbb", "depends_on: [aaaaaa]\n")}\n${block("cccccc")}`);
		await f.writer.moveSub("i-1#cccccc", 0);
		expect(f.subs().map((s) => s.id)).toEqual(["cccccc", "aaaaaa", "bbbbbb"]);
		await expect(f.writer.deleteSub("i-1#aaaaaa")).rejects.toThrow(/depends_on/);
		await f.writer.deleteSub("i-1#bbbbbb");
		expect(f.subs().map((s) => s.id)).toEqual(["cccccc", "aaaaaa"]);
	});

	it("ドラッグと Move up / down は、読めないブロックと隠した行を含む md の並びで移す", async () => {
		const broken = "<!-- sub-issue\nid: xxxxxx\nsummary: [壊れ\n-->\n";
		const f = fixture(`${HEAD}\n${block("aaaaaa")}\n${broken}\n${block("bbbbbb")}\n${block("cccccc").replace("open", "closed")}\n${block("dddddd")}`);
		await f.writer.moveSubBefore("i-1#dddddd", "i-1#bbbbbb");
		expect(f.subs().map((s) => s.id)).toEqual(["aaaaaa", "dddddd", "bbbbbb", "cccccc"]);
		expect(f.text()).toContain(broken);
		await f.writer.moveSubBefore("i-1#aaaaaa", null);
		expect(f.subs().map((s) => s.id)).toEqual(["dddddd", "bbbbbb", "cccccc", "aaaaaa"]);
		// c は closed で隠れている。b を下へ動かすと、隣の出ている行 a をまたぐ
		await f.writer.stepSub("i-1#bbbbbb", ["i-1#dddddd", "i-1#bbbbbb", "i-1#aaaaaa"], 1);
		expect(f.subs().map((s) => s.id)).toEqual(["dddddd", "cccccc", "aaaaaa", "bbbbbb"]);
		await f.writer.stepSub("i-1#dddddd", ["i-1#dddddd", "i-1#aaaaaa", "i-1#bbbbbb"], -1);
		expect(f.subs().map((s) => s.id)).toEqual(["dddddd", "cccccc", "aaaaaa", "bbbbbb"]);
	});

	it("直すときは検査を通し、通らなければ書かない。status の変化は statuslog に書く", async () => {
		const f = fixture(`${HEAD}\n${block("aaaaaa")}\n${block("bbbbbb")}`);
		const before = f.text();
		await expect(f.writer.updateSub("i-1#aaaaaa", { dependsOn: ["aaaaaa"] })).rejects.toThrow(/自分自身/);
		await expect(f.writer.updateSub("i-1#aaaaaa", { start: "2026-11-20", end: "2026-11-10" })).rejects.toThrow(/end/);
		expect(f.text()).toBe(before);
		await f.writer.updateSub("i-1#bbbbbb", { status: "closed", body: "終わった" });
		expect(f.subs()[1]).toMatchObject({ status: "closed", body: "終わった" });
		const logs = [...f.texts].filter(([p]) => p.startsWith("statuslog/")).flatMap(([p, t]) => parseStatusLog(p, t).entries);
		expect(logs.map((e) => [e.task, e.sub, e.from, e.to])).toEqual([["i-1", "bbbbbb", "open", "closed"]]);
	});
});

describe("本文のサブの領域（ADR-0158）", () => {
	const text = `${HEAD}\n${block("aaaaaa")}${block("bbbbbb")}`;
	it("領域の始まりは最初のマーカーの行頭。サブがなければ null", () => {
		const at = subAreaOffset(text)!;
		expect(text.slice(at).startsWith("<!-- sub-issue")).toBe(true);
		expect(text[at - 1]).toBe("\n");
		expect(subAreaOffset(HEAD)).toBeNull();
	});
	it("リーディング: マーカーの行を含むセクションに描き、後ろは隠し、前は触らない", () => {
		expect(subAreaRole(10, 0, 8)).toBe("before");
		expect(subAreaRole(10, 10, 14)).toBe("mount");
		expect(subAreaRole(10, 8, 10)).toBe("mount");
		expect(subAreaRole(10, 15, 20)).toBe("hide");
		expect(subAreaRole(null, 15, 20)).toBe("before");
	});
});

describe("展開の状態（ADR-0158）", () => {
	it("ノートごとに開閉を入れ替え、消えたサブは取り除く。元の値は変えない", () => {
		const base = { "issue/i-1.md": ["aaaaaa", "gone00"] };
		const opened = toggleSubOpen(base, "issue/i-1.md", "bbbbbb", ["aaaaaa", "bbbbbb"]);
		expect(opened).toEqual({ "issue/i-1.md": ["aaaaaa", "bbbbbb"] });
		expect(base["issue/i-1.md"]).toEqual(["aaaaaa", "gone00"]);
		expect(isSubOpen(opened, "issue/i-1.md", "bbbbbb")).toBe(true);
		const closed = toggleSubOpen(opened, "issue/i-1.md", "aaaaaa", ["aaaaaa", "bbbbbb"]);
		expect(closed).toEqual({ "issue/i-1.md": ["bbbbbb"] });
		// 最後の 1 件を閉じるとノートの項目ごとなくす
		expect(toggleSubOpen(closed, "issue/i-1.md", "bbbbbb", ["bbbbbb"])).toEqual({});
	});
	it("保存された値は、形の違うものを捨てて読む", () => {
		expect(sanitizeSubOpen({ "issue/i-1.md": ["aaaaaa", "AAA", 3, "aaaaaa"], "issue/i-2.md": "x", "issue/i-3.md": [] })).toEqual({ "issue/i-1.md": ["aaaaaa"] });
		expect(sanitizeSubOpen(null)).toEqual({});
		expect(sanitizeSubOpen([])).toEqual({});
	});
});

describe("Live Preview のカーソルとサブの領域（ADR-0158）", () => {
	it("領域の先頭と終わりは中に数えず、中の位置と、領域にかかる選択は中に数える", () => {
		expect(cursorInsideSubArea({ from: 10, to: 10 }, 10, 50)).toBe(false);
		expect(cursorInsideSubArea({ from: 50, to: 50 }, 10, 50)).toBe(false);
		expect(cursorInsideSubArea({ from: 11, to: 11 }, 10, 50)).toBe(true);
		expect(cursorInsideSubArea({ from: 0, to: 20 }, 10, 50)).toBe(true);
		expect(cursorInsideSubArea({ from: 0, to: 10 }, 10, 50)).toBe(false);
	});
});
