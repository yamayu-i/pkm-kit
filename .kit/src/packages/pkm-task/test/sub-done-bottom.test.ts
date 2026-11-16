import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import {
	becomesDone,
	isDone,
	parseSubIssues,
	subHeadChange,
	updateSubIssueText,
	type TextChange,
} from "../src/core/sub-issue";

const HEAD = "---\ntype: issue\nid: i-1\nsummary: 親\nstatus: open\n---\n\n親の本文\n\n";
const block = (id: string, status = "open", body = `${id} の本文`) => `<!-- sub-issue\nid: ${id}\nsummary: ${id}\nstatus: ${status}\n-->\n\n${body}\n\n`;
const ids = (text: string) => parseSubIssues("issue/i-1.md", "i-1", text, parse).subs.map((s) => s.id);
const members = new Set<string>();

function apply(text: string, changes: TextChange[]): string {
	return [...changes].sort((a, b) => b.from - a.from).reduce((t, c) => t.slice(0, c.from) + c.insert + t.slice(c.to), text);
}

describe("終わったサブを末尾へ送る（ADR-0181）", () => {
	it("終わりに変わる向きだけを判定する", () => {
		expect(becomesDone("open", "closed")).toBe(true);
		expect(becomesDone("in-progress", "canceled")).toBe(true);
		expect(becomesDone("closed", "canceled")).toBe(false);
		expect(becomesDone("closed", "open")).toBe(false);
		expect(isDone({ status: "canceled" })).toBe(true);
	});

	it("closed / canceled にしたサブのブロックは末尾へ移り、本文も一緒に動く", () => {
		const text = HEAD + block("aaaaaa") + block("bbbbbb") + block("cccccc");
		const r = updateSubIssueText("issue/i-1.md", "i-1", text, "aaaaaa", { status: "closed" }, parse);
		expect(ids(r.text)).toEqual(["bbbbbb", "cccccc", "aaaaaa"]);
		expect(r.text).toContain("aaaaaa の本文");
		expect(r.text.startsWith(HEAD)).toBe(true);
		const c = updateSubIssueText("issue/i-1.md", "i-1", r.text, "bbbbbb", { status: "canceled" }, parse);
		expect(ids(c.text)).toEqual(["cccccc", "aaaaaa", "bbbbbb"]);
	});

	it("終わったサブがすでにあれば、その後ろに置く。すでに末尾なら動かさない", () => {
		const text = HEAD + block("aaaaaa") + block("bbbbbb", "closed") + block("cccccc");
		expect(ids(updateSubIssueText("issue/i-1.md", "i-1", text, "aaaaaa", { status: "closed" }, parse).text)).toEqual(["bbbbbb", "cccccc", "aaaaaa"]);
		const last = updateSubIssueText("issue/i-1.md", "i-1", text, "cccccc", { status: "closed" }, parse);
		expect(ids(last.text)).toEqual(["aaaaaa", "bbbbbb", "cccccc"]);
	});

	it("open に戻しても、ほかの項目を直しても動かさない。終わったまま直しても動かさない", () => {
		const text = HEAD + block("aaaaaa", "closed") + block("bbbbbb");
		expect(ids(updateSubIssueText("issue/i-1.md", "i-1", text, "aaaaaa", { status: "open" }, parse).text)).toEqual(["aaaaaa", "bbbbbb"]);
		expect(ids(updateSubIssueText("issue/i-1.md", "i-1", text, "aaaaaa", { summary: "直した" }, parse).text)).toEqual(["aaaaaa", "bbbbbb"]);
		expect(ids(updateSubIssueText("issue/i-1.md", "i-1", text, "aaaaaa", { status: "canceled" }, parse).text)).toEqual(["aaaaaa", "bbbbbb"]);
	});

	it("読めないブロックは元の文字のまま残す", () => {
		const broken = "<!-- sub-issue\nid: xxxxxx\nsummary: [壊れ\n-->\n\n";
		const text = HEAD + block("aaaaaa") + broken + block("bbbbbb");
		const r = updateSubIssueText("issue/i-1.md", "i-1", text, "aaaaaa", { status: "closed" }, parse);
		expect(ids(r.text)).toEqual(["bbbbbb", "aaaaaa"]);
		expect(r.text).toContain(broken.trimEnd());
	});

	it("エディタ向けの変更は、ファイルへの書き込みと同じ並びになる。本文とほかのサブには触れない", () => {
		const text = HEAD + block("aaaaaa", "open", "一行目\n\n二行目") + block("bbbbbb") + block("cccccc");
		const r = subHeadChange("issue/i-1.md", "i-1", text, "aaaaaa", { status: "closed" }, parse, members);
		const next = apply(text, r.changes);
		expect(ids(next)).toEqual(["bbbbbb", "cccccc", "aaaaaa"]);
		expect(next).toContain("status: closed");
		expect(next).toContain("一行目\n\n二行目");
		expect(next.slice(HEAD.length)).toContain(block("bbbbbb") + block("cccccc"));
	});

	it("末尾の改行がない文書でも、ブロックが行頭から始まる", () => {
		const text = (HEAD + block("aaaaaa") + block("bbbbbb")).trimEnd();
		const next = apply(text, subHeadChange("issue/i-1.md", "i-1", text, "aaaaaa", { status: "closed" }, parse, members).changes);
		expect(ids(next)).toEqual(["bbbbbb", "aaaaaa"]);
	});

	it("終わりに変わらない・すでに末尾なら、項目の書き換えだけ", () => {
		const text = HEAD + block("aaaaaa") + block("bbbbbb");
		expect(subHeadChange("issue/i-1.md", "i-1", text, "aaaaaa", { summary: "x" }, parse, members).changes).toHaveLength(1);
		const r = subHeadChange("issue/i-1.md", "i-1", text, "bbbbbb", { status: "closed" }, parse, members);
		expect(r.changes).toEqual([r.change]);
	});
});
