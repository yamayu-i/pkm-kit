import { describe, expect, it, vi } from "vitest";
import { parse } from "yaml";
import { serializeBoardLogEntry, type BoardOp } from "../src/core/board-log";
import { TaskIndex } from "../src/core/index";
import { collectVault } from "../src/core/load";
import type { TaskContext } from "../src/obsidian/context";

/** ADR-0137: ボードの画面の操作（候補・★・並べ替え・サブを載せる・持ち越す） */

const notices: string[] = [];
vi.mock("obsidian", () => {
	class Base {
		constructor(..._args: unknown[]) {}
		setPlaceholder() {}
		open() {}
	}
	return {
		Notice: class {
			constructor(message: string) {
				notices.push(message);
			}
		},
		Menu: Base,
		Modal: Base,
		SuggestModal: Base,
		FuzzySuggestModal: Base,
		Keymap: { isModEvent: () => false },
		setIcon: () => {},
		prepareFuzzySearch: (q: string) => (text: string) => (text.includes(q) ? { score: 1 } : null),
		TFile: class {},
		normalizePath: (p: string) => p,
		parseYaml: parse,
	};
});

const { boardCandidates } = await import("../src/views/Board");
const { boardSuggestions, boardChoiceText } = await import("../src/obsidian/modals");
const { addSubToBoard, carrySubs, moveCard, setStar, stepCard } = await import("../src/obsidian/board-actions");

const DATE = "2026-11-16";
let seq = 0;
const line = (op: BoardOp, date = DATE) => serializeBoardLogEntry({ id: `bo_${++seq}`, at: `2026-11-16T00:00:00.${String(seq).padStart(3, "0")}Z`, date, ...op });
const sub = (id: string, summary: string, status = "open", scheduled: string | null = null) =>
	`<!-- sub-issue\nid: ${id}\nsummary: ${summary}\nstatus: ${status}\n${scheduled ? `scheduled: ${scheduled}\n` : ""}-->\n\n`;
function issue(id: string, status = "open", subs = "") {
	const fm = { type: "issue", id, summary: `s${id}`, status };
	return { path: `issue/${id}.md`, frontmatter: fm, text: `---\n${JSON.stringify(fm)}\n---\n\n${subs}` };
}

function setup(lines: string[]) {
	const markdown = [
		issue("i-1", "open", sub("aaaaaa", "仕様", "open", DATE) + sub("bbbbbb", "実装") + sub("cccccc", "試験", "closed")),
		issue("i-2"),
		issue("i-3"),
		issue("i-4"),
		issue("i-5", "closed"),
		issue("i-6"),
	];
	const index = new TaskIndex(collectVault({ markdown, worklogs: [], labels: null, parseYaml: parse, boardLogs: [{ path: "board/pc/2026-11.jsonl", text: lines.join("\n") }] }).data);
	const ops: BoardOp[] = [];
	const patches: [string, unknown][] = [];
	const ctx = {
		store: { index },
		settings: { deviceName: "pc" },
		writer: {
			appendBoardOps: vi.fn(async (_date: string, _device: string, o: BoardOp[]) => void ops.push(...o)),
			updateSub: vi.fn(async (key: string, patch: unknown) => void patches.push([key, patch])),
		},
		report: vi.fn(),
	} as unknown as TaskContext;
	return { index, ctx, ops, patches };
}

describe("Add issue の候補（ADR-0137）", () => {
	it("ボードにない active な issue と、その日が scheduled でない active なサブ。サブは `i-1 › 題`", () => {
		const { index } = setup([line({ op: "add", task: "i-2" })]);
		const items = boardCandidates(index, DATE, index.board(DATE)!.board);
		expect(items.map(boardChoiceText)).toEqual(["i-1 si-1", "i-3 si-3", "i-4 si-4", "i-6 si-6", "i-1 › 実装"]);
	});

	it("検索では作る候補を常に最後に出す", () => {
		const { index } = setup([]);
		const items = boardCandidates(index, DATE, index.board(DATE)?.board ?? { issues: [], stars: [], routines: {}, carried: [], closed: false });
		const hits = boardSuggestions(items, "実装", (q) => (text) => (text.includes(q) ? { score: 1 } : null));
		expect(hits.map((h) => (h.kind === "create" ? `+${h.summary}` : boardChoiceText(h)))).toEqual(["i-1 › 実装", "+実装"]);
	});
});

describe("サブを載せる・持ち越す（ADR-0137, 0152）", () => {
	it("サブを載せても日付（scheduled）は書かない", async () => {
		const { index, ctx, ops, patches } = setup([]);
		await addSubToBoard(ctx, DATE, index.sub("i-1#bbbbbb")!);
		expect(patches).toEqual([]);
		expect(ops).toEqual([{ op: "add", task: "i-1#bbbbbb" }]);
	});

	it("Back to Next: Calendar の日を消し、carry を書く", async () => {
		const { index, ctx, ops, patches } = setup([line({ op: "add", task: "i-1#aaaaaa" })]);
		await carrySubs(ctx, DATE, [index.sub("i-1#aaaaaa")!], "next");
		expect(patches).toEqual([["i-1#aaaaaa", { scheduled: null }]]);
		expect(ops).toEqual([{ op: "carry", task: "i-1#aaaaaa" }]);
	});

	it("Calendar の日がないサブを Back to Next にしても、項目は書かない", async () => {
		const { index, ctx, ops, patches } = setup([line({ op: "add", task: "i-1#bbbbbb" })]);
		await carrySubs(ctx, DATE, [index.sub("i-1#bbbbbb")!], "next");
		expect(patches).toEqual([]);
		expect(ops).toEqual([{ op: "carry", task: "i-1#bbbbbb" }]);
	});
});

describe("★ と並べ替え（ADR-0137）", () => {
	// i-1#aaaaaa は今日の Calendar（Calendar の欄。★ も並べ替えもしない。ADR-0255）なので、ふつうのカードには i-1#bbbbbb と i-6 を使う
	const base = ["i-2", "i-3", "i-4", "i-1#bbbbbb"].map((task) => line({ op: "add", task }));

	it("★ を付け外しする。4 件あるときは付けずに知らせる", async () => {
		const { ctx, ops } = setup([...base, line({ op: "add", task: "i-6" }), ...["i-2", "i-3", "i-4", "i-6"].map((task) => line({ op: "star", task, on: true }))]);
		notices.length = 0;
		await setStar(ctx, DATE, "i-1#bbbbbb", true);
		expect(ops).toEqual([]);
		expect(notices).toEqual(["★ は 4 件までです。ほかの ★ を外してから付けてください"]);
		await setStar(ctx, DATE, "i-2", false);
		expect(ops).toEqual([{ op: "star", task: "i-2", on: false }]);
	});

	it("Top 4 に落とすと ★ が付き、4 件あるときは入れない", async () => {
		const { ctx, ops } = setup(base);
		await moveCard(ctx, DATE, "i-4", "top", null);
		expect(ops).toEqual([
			{ op: "star", task: "i-4", on: true },
			{ op: "order", tasks: ["i-4", "i-2", "i-3", "i-1#bbbbbb"] },
		]);
		const full = setup([...base, line({ op: "add", task: "i-6" }), ...["i-2", "i-3", "i-4", "i-6"].map((task) => line({ op: "star", task, on: true }))]);
		await moveCard(full.ctx, DATE, "i-1#bbbbbb", "top", "i-2");
		expect(full.ops).toEqual([]);
	});

	it("Move down は同じ欄の中で 1 つ下へ", async () => {
		const { ctx, ops } = setup(base);
		await stepCard(ctx, DATE, "i-2", 1);
		expect(ops).toEqual([{ op: "order", tasks: ["i-3", "i-2", "i-4", "i-1#bbbbbb"] }]);
	});
});
