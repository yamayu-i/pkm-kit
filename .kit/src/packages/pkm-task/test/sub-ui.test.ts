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
	cursorInside,
	isSubOpen,
	sanitizeSubOpen,
	stepPosition,
	layoutSubIssues,
	subHeadChange,
	subSectionRole,
	toggleSubOpen,
	subCounts,
	subHint,
	subItemPatch,
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

describe("サブごとの範囲（ADR-0161）", () => {
	const text = `${HEAD}\n${block("aaaaaa")}本文 a1\n\n本文 a2\n\n${block("bbbbbb")}\n<!-- sub-issue\nid: cccccc\nsummary: [壊れ\n-->\nc の本文\n${block("dddddd")}`;
	const layout = layoutSubIssues("issue/i-1.md", "i-1", text, parse);
	it("項目は行頭から --> の行の終わりまで。本文は次の行から最後の空でない行の終わりまで", () => {
		expect(layout.map((b) => b.id)).toEqual(["aaaaaa", "bbbbbb", null, "dddddd"]);
		const [a, b, c, d] = layout;
		expect(text.slice(a!.from, a!.cardTo!)).toBe(block("aaaaaa").trimEnd());
		expect(text.slice(a!.bodyFrom!, a!.bodyTo!)).toBe("本文 a1\n\n本文 a2");
		// 本文がなければ、隠す範囲は空
		expect(b!.bodyTo).toBe(b!.bodyFrom);
		// 読めなくても --> があれば項目の範囲は求まる（id は null）
		expect(text.slice(c!.from, c!.cardTo!).endsWith("-->")).toBe(true);
		expect(text.slice(c!.bodyFrom!, c!.bodyTo!)).toBe("c の本文");
		expect(text.slice(d!.from, d!.cardTo!)).toBe(block("dddddd").trimEnd());
	});
	it("行の番号（0 から）も求める。--> がなければ項目の範囲は null", () => {
		const lines = text.split("\n");
		const a = layout[0]!;
		expect(lines[a.startLine]).toBe("<!-- sub-issue");
		expect(lines[a.endLine!]).toBe("-->");
		expect(lines[a.bodyStartLine]).toBe("本文 a1");
		expect(lines[a.bodyEndLine]).toBe("本文 a2");
		const open = layoutSubIssues("issue/i-1.md", "i-1", `${HEAD}\n<!-- sub-issue\nid: aaaaaa\n`, parse);
		expect(open[0]).toMatchObject({ id: null, cardTo: null, endLine: null });
		expect(layoutSubIssues("issue/i-1.md", "i-1", HEAD, parse)).toEqual([]);
	});
	it("CRLF でも、範囲は行の終わり（\\r の前）までにする", () => {
		const crlf = `${HEAD}\n${block("aaaaaa")}本文\n`.replace(/\n/g, "\r\n");
		const [a] = layoutSubIssues("issue/i-1.md", "i-1", crlf, parse);
		expect(crlf.slice(a!.from, a!.cardTo!).endsWith("-->")).toBe(true);
		expect(crlf.slice(a!.bodyFrom!, a!.bodyTo!)).toBe("本文");
	});
});

describe("カードの書き換え（エディタの文書の範囲だけを置き換える。ADR-0161）", () => {
	const text = `${HEAD}\n${block("aaaaaa")}\n本文 a\n\n${block("bbbbbb")}\n本文 b\n`;
	const members = new Set<string>();
	const apply = (t: string, c: { from: number; to: number; insert: string }) => t.slice(0, c.from) + c.insert + t.slice(c.to);
	it("項目のブロックだけを置き換え、本文と親の部分は 1 文字も変えない", () => {
		const r = subHeadChange("issue/i-1.md", "i-1", text, "aaaaaa", { summary: "新しい題", status: "in-progress" }, parse, members);
		const next = apply(text, r.change);
		expect(next).toBe(text.replace("summary: aaaaaa\nstatus: open", 'summary: "新しい題"\nstatus: in-progress'));
		expect(subsOf(next)[0]).toMatchObject({ summary: "新しい題", status: "in-progress", body: "本文 a" });
		expect(r.before.status).toBe("open");
		expect(r.after.status).toBe("in-progress");
	});
	it("本文の末尾の改行や空行は、項目を書き換えても残る", () => {
		const typed = `${HEAD}\n${block("aaaaaa")}一行目\n\n\n`;
		const r = subHeadChange("issue/i-1.md", "i-1", typed, "aaaaaa", { estimated: 60 }, parse, members);
		expect(apply(typed, r.change).endsWith("-->\n一行目\n\n\n")).toBe(true);
	});
	it("検査に通らなければ例外。delegated を外すと委任先も外す", () => {
		expect(() => subHeadChange("issue/i-1.md", "i-1", text, "aaaaaa", { dependsOn: ["aaaaaa"] }, parse, members)).toThrow(/自分自身/);
		expect(() => subHeadChange("issue/i-1.md", "i-1", text, "zzzzzz", { summary: "x" }, parse, members)).toThrow(/サブがありません/);
		const delegated = text.replace("status: open", "status: delegated\ndelegated_to: m-1");
		const r = subHeadChange("issue/i-1.md", "i-1", delegated, "aaaaaa", { status: "open" }, parse, new Set(["m-1"]));
		expect(r.after.delegatedTo).toBeNull();
	});
});

describe("リーディング表示のセクションの役割（ADR-0161）", () => {
	const text = `${HEAD}\n${block("aaaaaa")}\n本文 a\n\n- リスト\n\n${block("bbbbbb")}\n本文 b\n`;
	const layout = layoutSubIssues("issue/i-1.md", "i-1", text, parse);
	const [a, b] = layout;
	it("マーカーの行を含むセクションはカード、その後ろから次のマーカーまでは本文、前は何でもない", () => {
		expect(subSectionRole(layout, 0, 8)).toEqual({ role: "none" });
		expect(subSectionRole(layout, a!.startLine, a!.endLine!)).toEqual({ role: "card", index: 0, id: "aaaaaa" });
		expect(subSectionRole(layout, a!.bodyStartLine, a!.bodyStartLine)).toEqual({ role: "body", id: "aaaaaa" });
		expect(subSectionRole(layout, a!.bodyEndLine, a!.bodyEndLine)).toEqual({ role: "body", id: "aaaaaa" });
		expect(subSectionRole(layout, b!.startLine, b!.endLine!)).toEqual({ role: "card", index: 1, id: "bbbbbb" });
		expect(subSectionRole(layout, b!.bodyStartLine, b!.bodyEndLine)).toEqual({ role: "body", id: "bbbbbb" });
	});
	it("項目の途中のセクションは隠す。読めないブロックの本文は隠さない", () => {
		expect(subSectionRole(layout, a!.startLine + 1, a!.startLine + 1)).toEqual({ role: "hide" });
		const broken = layoutSubIssues("issue/i-1.md", "i-1", `${HEAD}\n<!-- sub-issue\nid: x\nsummary: [壊れ\n-->\n本文\n`, parse);
		expect(subSectionRole(broken, broken[0]!.bodyStartLine, broken[0]!.bodyEndLine)).toEqual({ role: "none" });
		expect(subSectionRole([], 3, 4)).toEqual({ role: "none" });
	});
});

describe("カーソルが範囲の中か（ADR-0161）", () => {
	it("先頭と終わりの位置は中に数えない。選択は重なれば中", () => {
		expect(cursorInside({ from: 5, to: 5 }, 5, 10)).toBe(false);
		expect(cursorInside({ from: 10, to: 10 }, 5, 10)).toBe(false);
		expect(cursorInside({ from: 6, to: 6 }, 5, 10)).toBe(true);
		expect(cursorInside({ from: 0, to: 5 }, 5, 10)).toBe(false);
		expect(cursorInside({ from: 0, to: 6 }, 5, 10)).toBe(true);
		expect(cursorInside({ from: 0, to: 99 }, 5, 10)).toBe(true);
	});
});

describe("Edit ダイアログの保存（ADR-0179）", () => {
	it("項目だけを書き、本文には触れない", () => {
		const s = { ...sub("estimated: 30\n"), summary: "  題  ", body: "本文" };
		const patch = subItemPatch(s, 60);
		expect(patch).not.toHaveProperty("body");
		expect(patch.summary).toBe("題");
		expect(patch.estimated).toBe(60);
	});
});
