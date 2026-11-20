import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { TaskIndex, emptyVaultData, type VaultData } from "../src/core/index";
import { lintVault } from "../src/core/lint";
import { collectVault } from "../src/core/load";
import { parseIssue, parseMember } from "../src/core/schema";
import {
	SubIssueFormatError,
	formatSubIssue,
	isSubId,
	newSubId,
	parseSubIssues,
	parseSubKey,
	replaceSubIssues,
	splitSubIssueText,
	subKey,
	type SubIssue,
} from "../src/core/sub-issue";

const FRONT = "---\ntype: issue\nid: i-12\nsummary: 親\nstatus: open\n---\n";
const HEAD = `${FRONT}\n## Note\n\n親の本文\n`;

const SAMPLE = `${HEAD}
<!-- sub-issue
id: k3f9a2
summary: 仕様を決める
status: in-progress
start: 2026-11-16
end: 2026-11-20
estimated: 120
created: 2026-11-15T10:00:00+09:00
-->
サブの本文（ふつうの Markdown）

---

続き

<!-- sub-issue
id: p8d2mz
summary: 実装する
status: open
depends_on: [k3f9a2]
created: 2026-11-15T10:05:00+09:00
-->
`;

function subsOf(text: string, parent = "i-12") {
	return parseSubIssues("issue/i-12.md", parent, text, parse);
}

describe("splitSubIssueText", () => {
	it("最初のマーカーの前が親の本文、後ろがサブのブロック", () => {
		const { head, blocks } = splitSubIssueText(SAMPLE);
		expect(head).toBe(`${HEAD}\n`);
		expect(blocks).toHaveLength(2);
		expect(blocks[0]!.startsWith("<!-- sub-issue\nid: k3f9a2")).toBe(true);
		expect(blocks[1]!.startsWith("<!-- sub-issue\nid: p8d2mz")).toBe(true);
	});

	it("マーカーがなければサブはない", () => {
		expect(splitSubIssueText(HEAD)).toEqual({ head: HEAD, blocks: [] });
	});

	it("frontmatter の中や行頭でないマーカーは数えない", () => {
		const text = `---\ntype: issue\nid: i-1\nnote: "<!-- sub-issue"\n---\n本文 <!-- sub-issue\n`;
		expect(splitSubIssueText(text).blocks).toEqual([]);
	});
});

describe("parseSubIssues", () => {
	it("項目と本文と並びを読む", () => {
		const { subs, problems } = subsOf(SAMPLE);
		expect(problems).toEqual([]);
		expect(subs.map((s) => s.key)).toEqual(["i-12#k3f9a2", "i-12#p8d2mz"]);
		expect(subs[0]).toMatchObject({
			parent: "i-12",
			path: "issue/i-12.md",
			id: "k3f9a2",
			order: 0,
			summary: "仕様を決める",
			status: "in-progress",
			start: "2026-11-16",
			end: "2026-11-20",
			estimated: 120,
			scheduled: null,
			dependsOn: [],
			delegatedTo: null,
			migratedFrom: null,
			body: "サブの本文（ふつうの Markdown）\n\n---\n\n続き",
		});
		expect(subs[1]).toMatchObject({ id: "p8d2mz", order: 1, dependsOn: ["k3f9a2"], body: "" });
	});

	it("YAML が読めないブロックは捨てずに残し、エラーにする", () => {
		const text = `${HEAD}\n<!-- sub-issue\nid: aaaaaa\nsummary: [壊れ\n-->\n本文\n\n<!-- sub-issue\nid: bbbbbb\nsummary: 良い\nstatus: open\n-->\n`;
		const { subs, blocks, problems } = subsOf(text);
		expect(subs.map((s) => s.id)).toEqual(["bbbbbb"]);
		expect(blocks).toHaveLength(2);
		expect(blocks[0]!.sub).toBeNull();
		expect(problems.map((p) => p.code)).toEqual(["invalid-sub-issue"]);
	});

	it("閉じの --> がない・id の書式が違う・summary がないものはエラー", () => {
		const noClose = subsOf(`${HEAD}\n<!-- sub-issue\nid: aaaaaa\nsummary: x\nstatus: open\n`);
		expect(noClose.subs).toEqual([]);
		expect(noClose.problems.map((p) => p.code)).toEqual(["invalid-sub-issue"]);
		const badId = subsOf(`${HEAD}\n<!-- sub-issue\nid: ABC\nsummary: x\nstatus: open\n-->\n`);
		expect(badId.subs).toEqual([]);
		expect(badId.problems.map((p) => p.code)).toEqual(["invalid-sub-issue"]);
		const noSummary = subsOf(`${HEAD}\n<!-- sub-issue\nid: aaaaaa\nstatus: open\n-->\n`);
		expect(noSummary.subs.map((s) => s.id)).toEqual(["aaaaaa"]);
		expect(noSummary.problems.map((p) => p.code)).toEqual(["invalid-sub-issue"]);
	});

	it("項目の型の誤りは issue と同じ code で、サブの id を添える", () => {
		const { problems } = subsOf(`${HEAD}\n<!-- sub-issue\nid: aaaaaa\nsummary: x\nstatus: done\nstart: 明日\n-->\n`);
		expect(problems.map((p) => p.code)).toEqual(["invalid-field", "invalid-date"]);
		expect(problems.every((p) => p.message.startsWith("サブ aaaaaa: "))).toBe(true);
	});
});

describe("なくした期限の項目（ADR-0190）", () => {
	it("soft_deadline / deadline は読まずに警告し、書き換えると消える", () => {
		const text = `${HEAD}\n<!-- sub-issue\nid: aaaaaa\nsummary: x\nstatus: open\nend: 2026-11-20\nsoft_deadline: 2026-11-18\ndeadline: 2026-11-19\n-->\n`;
		const { subs, problems } = subsOf(text);
		expect(problems.map((p) => [p.severity, p.code])).toEqual([["warning", "sub-deadline-removed"]]);
		expect(problems[0]!.message).toContain("soft_deadline と deadline");
		expect(subs[0]).not.toHaveProperty("deadline");
		expect(subs[0]).not.toHaveProperty("softDeadline");
		const written = replaceSubIssues(text, subs);
		expect(written).not.toContain("deadline");
		expect(written).toContain("end: 2026-11-20");
		expect(subsOf(written).problems).toEqual([]);
	});
});

describe("書き出し", () => {
	it("パース → 書き出し → パースで同じになる（本文と並びも保つ）", () => {
		const first = subsOf(SAMPLE);
		const written = replaceSubIssues(SAMPLE, first.subs);
		const again = subsOf(written);
		expect(again.problems).toEqual([]);
		expect(again.subs).toEqual(first.subs);
		expect(splitSubIssueText(written).head).toBe(`${HEAD}\n`);
	});

	it("書き出しは ADR の表の順で、空の項目を書かない", () => {
		const { subs } = subsOf(SAMPLE);
		expect(formatSubIssue(subs[1]!)).toBe(
			'<!-- sub-issue\nid: p8d2mz\nsummary: "実装する"\nstatus: open\ndepends_on: ["k3f9a2"]\ncreated: 2026-11-15T10:05:00+09:00\n-->\n',
		);
	});

	it("並べ替えて書くと、その順に読める", () => {
		const { subs } = subsOf(SAMPLE);
		const written = replaceSubIssues(SAMPLE, [subs[1]!, subs[0]!]);
		expect(subsOf(written).subs.map((s) => s.id)).toEqual(["p8d2mz", "k3f9a2"]);
	});

	it("読めなかったブロックは元の文字のまま書き戻す", () => {
		const broken = "<!-- sub-issue\nid: aaaaaa\nsummary: [壊れ\n-->\n本文";
		const text = `${HEAD}\n${broken}\n\n<!-- sub-issue\nid: bbbbbb\nsummary: 良い\nstatus: open\n-->\n`;
		const { blocks } = subsOf(text);
		const written = replaceSubIssues(text, blocks.map((b) => b.sub ?? b.raw));
		expect(written).toContain(`${broken}\n`);
		expect(subsOf(written).subs.map((s) => s.id)).toEqual(["bbbbbb"]);
	});

	it("サブがない issue に足すと、親の本文の後ろに空行を挟んで置く", () => {
		const { subs } = subsOf(SAMPLE);
		const written = replaceSubIssues(HEAD, [subs[1]!]);
		expect(written.startsWith(`${HEAD}\n<!-- sub-issue\n`)).toBe(true);
	});

	it("すべて消すと、親の本文だけが残る", () => {
		expect(replaceSubIssues(SAMPLE, [])).toBe(HEAD);
		expect(replaceSubIssues(HEAD, [])).toBe(HEAD);
	});

	it("値の --> と、本文の行頭の <!-- sub-issue を受け付けない", () => {
		const { subs } = subsOf(SAMPLE);
		const sub = subs[0]!;
		expect(() => formatSubIssue({ ...sub, summary: "a --> b" })).toThrow(SubIssueFormatError);
		expect(() => formatSubIssue({ ...sub, body: "x\n<!-- sub-issue\ny" })).toThrow(SubIssueFormatError);
		expect(() => formatSubIssue({ ...sub, body: "x <!-- sub-issue は行頭でなければよい" })).not.toThrow();
	});
});

describe("id と合成キー", () => {
	it("英小文字と数字の 6 文字で、同じ親の既存の id と重ならない", () => {
		const values = [0, 0, 0, 0, 0, 0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
		let i = 0;
		const id = newSubId(["aaaaaa"], () => values[i++]!);
		expect(id).toBe("ssssss");
		expect(isSubId(id)).toBe(true);
		for (let n = 0; n < 50; n++) expect(isSubId(newSubId([]))).toBe(true);
		expect(isSubId("abc12")).toBe(false);
		expect(isSubId("ABC123")).toBe(false);
	});

	it("合成キーを作り、分解する", () => {
		expect(subKey("i-12", "k3f9a2")).toBe("i-12#k3f9a2");
		expect(parseSubKey("i-12#k3f9a2")).toEqual({ parent: "i-12", id: "k3f9a2" });
		expect(parseSubKey("i-12")).toBeNull();
		expect(parseSubKey("r-1#k3f9a2")).toBeNull();
		expect(parseSubKey("i-12#K3F")).toBeNull();
	});
});

function issueText(id: string, subs: string): { path: string; frontmatter: Record<string, unknown>; text: string } {
	const fm = { type: "issue", id, summary: id, status: "open" };
	return { path: `issue/${id}.md`, frontmatter: fm, text: `---\ntype: issue\nid: ${id}\n---\n\n${subs}` };
}

function block(id: string, extra = ""): string {
	return `<!-- sub-issue\nid: ${id}\nsummary: ${id}\nstatus: open\n${extra}-->\n\n`;
}

describe("collectVault と索引", () => {
	it("issue の本文からサブを読み、親ごとと合成キーで引ける", () => {
		const { data, problems } = collectVault({
			markdown: [issueText("i-1", block("aaaaaa") + block("bbbbbb")), issueText("i-2", block("aaaaaa"))],
			worklogs: [],
			labels: null,
			parseYaml: parse,
		});
		expect(problems).toEqual([]);
		const index = new TaskIndex(data);
		expect(index.subs("i-1").map((s) => s.key)).toEqual(["i-1#aaaaaa", "i-1#bbbbbb"]);
		expect(index.subs("i-3")).toEqual([]);
		expect(index.sub("i-2#aaaaaa")?.parent).toBe("i-2");
		expect(index.sub("i-2#bbbbbb")).toBeUndefined();
	});

	it("本文か YAML の関数がなければ、サブは読まない", () => {
		const { data } = collectVault({ markdown: [issueText("i-1", block("aaaaaa"))], worklogs: [], labels: null });
		expect(data.subIssues).toEqual([]);
	});
});

function vault(text: string, extra: Partial<VaultData> = {}): VaultData {
	// 親は整理済み（Inbox の Project のサブの期間は period-in-inbox になる。ADR-0210）
	const issue = parseIssue("issue/i-1.md", { type: "issue", id: "i-1", summary: "i-1", status: "open", clarified: true }).value!;
	const { subs } = parseSubIssues("issue/i-1.md", "i-1", text, parse);
	return { ...emptyVaultData(), issues: [issue], subIssues: subs, ...extra };
}

function codes(d: VaultData): string[] {
	return lintVault(d).map((p) => `${p.severity} ${p.code}`);
}

describe("lint（サブ）", () => {
	it("同じ親で id が重なるとエラー", () => {
		expect(codes(vault(block("aaaaaa") + block("aaaaaa")))).toEqual(["error duplicate-sub-id"]);
	});

	it("依存先がない・自分自身・循環はエラー", () => {
		expect(codes(vault(block("aaaaaa", "depends_on: [zzzzzz]\n")))).toEqual(["error dangling-depends-on"]);
		expect(codes(vault(block("aaaaaa", "depends_on: [aaaaaa]\n")))).toEqual(["error self-depends-on"]);
		expect(codes(vault(block("aaaaaa", "depends_on: [bbbbbb]\n") + block("bbbbbb", "depends_on: [cccccc]\n") + block("cccccc", "depends_on: [aaaaaa]\n")))).toEqual([
			"error depends-on-cycle",
			"error depends-on-cycle",
			"error depends-on-cycle",
		]);
	});

	it("依存先の end より前に start があると警告", () => {
		const text = block("aaaaaa", "end: 2026-11-20\n") + block("bbbbbb", "start: 2026-11-19\ndepends_on: [aaaaaa]\n") + block("cccccc", "start: 2026-11-20\ndepends_on: [aaaaaa]\n");
		expect(codes(vault(text))).toEqual(["warning start-before-dependency"]);
	});

	it("delegated_to は issue と同じ規則", () => {
		const m1 = parseMember("member/m-1.md", { type: "member", id: "m-1", name: "佐藤" }).value!;
		expect(codes(vault(block("aaaaaa").replace("status: open", "status: delegated"), { members: [m1] }))).toEqual(["error missing-delegated-to"]);
		expect(codes(vault(block("aaaaaa", "delegated_to: m-9\n").replace("status: open", "status: delegated"), { members: [m1] }))).toEqual(["error dangling-member"]);
		expect(codes(vault(block("aaaaaa", "delegated_to: m-1\n"), { members: [m1] }))).toEqual(["warning stale-delegated-to"]);
	});

	it("問題のないサブは何も出さない", () => {
		const s: SubIssue[] = vault(block("aaaaaa") + block("bbbbbb", "depends_on: [aaaaaa]\n")).subIssues;
		expect(s).toHaveLength(2);
		expect(codes(vault(block("aaaaaa") + block("bbbbbb", "depends_on: [aaaaaa]\n")))).toEqual([]);
	});
});
