import { describe, expect, it } from "vitest";
import { formatDateTime } from "../src/core/date-format";
import {
	AT_TRIGGER,
	filterSnippets,
	inlineBody,
	layerSnippets,
	nextSlashSession,
	nextTriggerSession,
	parseSnippet,
	type SessionDoc,
	type Snippet,
} from "../src/core/snippet";

describe("formatDateTime の DDD", () => {
	it("曜日を英大文字 3 字にする（ddd は小文字のまま）", () => {
		const sun = new Date(2026, 10, 8, 9, 0, 0);
		expect(formatDateTime(sun, "YYYY-MM-DD DDD")).toBe("2026-11-08 SUN");
		expect(formatDateTime(sun, "ddd")).toBe("sun");
	});
});

describe("parseSnippet", () => {
	it("frontmatter の name と alias を読み、閉じる --- の行の直後からを本文にする（改行も含む）", () => {
		const text = "---\nname: today-h1\nalias: t1\n---\n# {{date}}\n\n\n";
		expect(parseSnippet("today-h1.md", text)).toEqual({
			snippet: { file: "today-h1.md", name: "today-h1", alias: "t1", body: "# {{date}}\n\n\n" },
			problem: null,
		});
	});

	it("引用符で囲んだ値と CRLF も読める", () => {
		const text = '---\r\nname: "a-b"\r\nalias: \'x\'\r\n---\r\nbody';
		expect(parseSnippet("a.md", text).snippet).toEqual({ file: "a.md", name: "a-b", alias: "x", body: "body" });
	});

	it("name か alias がない・ケバブケースでないものは問題として返す", () => {
		expect(parseSnippet("a.md", "---\nname: a\n---\nx").snippet).toBeNull();
		expect(parseSnippet("a.md", "---\nname: Today_H1\nalias: t1\n---\nx").problem).toMatch(/name/);
		expect(parseSnippet("a.md", "---\nname: a\nalias: t 1\n---\nx").problem).toMatch(/alias/);
		expect(parseSnippet("a.md", "frontmatter なし").snippet).toBeNull();
	});
});

const sn = (file: string, name: string, alias: string, body = ""): Snippet => ({ file, name, alias, body });

describe("layerSnippets", () => {
	it("同じファイル名ならその Vault のものを使う", () => {
		const out = layerSnippets([sn("a.md", "a", "u"), sn("b.md", "b", "b")], [sn("a.md", "a-local", "l")]);
		expect(out.map((s) => s.name).sort()).toEqual(["a-local", "b"]);
	});
});

describe("filterSnippets", () => {
	const list = [sn("3.md", "today-h3", "t3"), sn("1.md", "today-h1", "t1"), sn("m.md", "meeting", "mt")];

	it("空の検索語なら全件を alias の順に返す", () => {
		expect(filterSnippets(list, "").map((s) => s.alias)).toEqual(["mt", "t1", "t3"]);
	});

	it("name か alias の前方一致で絞り込む（大文字小文字は区別しない）", () => {
		expect(filterSnippets(list, "t").map((s) => s.alias)).toEqual(["t1", "t3"]);
		expect(filterSnippets(list, "today-h1").map((s) => s.alias)).toEqual(["t1"]);
		expect(filterSnippets(list, "ME").map((s) => s.alias)).toEqual(["mt"]);
		expect(filterSnippets(list, "oday")).toEqual([]);
	});
});

/** 文字列の文書。行頭の位置は改行の直後 */
function doc(text: string): SessionDoc {
	return {
		lineStartAt: (pos) => text.lastIndexOf("\n", pos - 1) + 1,
		slice: (from, to) => text.slice(from, to),
	};
}

describe("nextSlashSession", () => {
	let n = 0;
	const newId = () => ++n;
	const id = (p: number) => p;

	it("行頭に / を打ったら始まる", () => {
		const s = nextSlashSession(null, { typedAt: 4, mapPos: id, head: 5, empty: true }, doc("abc\n/"), newId);
		expect(s).toMatchObject({ from: 4 });
	});

	it("行頭でない / や、空白のあとの / では始まらない", () => {
		expect(nextSlashSession(null, { typedAt: 1, mapPos: id, head: 2, empty: true }, doc("a/"), newId)).toBeNull();
		expect(nextSlashSession(null, { typedAt: 1, mapPos: id, head: 2, empty: true }, doc(" /"), newId)).toBeNull();
	});

	it("打った / から続けて入力しているあいだは続く", () => {
		const s0 = nextSlashSession(null, { typedAt: 0, mapPos: id, head: 1, empty: true }, doc("/"), newId)!;
		const s1 = nextSlashSession(s0, { typedAt: null, mapPos: id, head: 3, empty: true }, doc("/t-"), newId);
		expect(s1).toEqual(s0);
	});

	it("カーソルが範囲の外に出たり、選択したり、ケバブケース以外を打ったり、/ を消したら終わる", () => {
		const s0 = nextSlashSession(null, { typedAt: 0, mapPos: id, head: 1, empty: true }, doc("/t\nx"), newId)!;
		expect(nextSlashSession(s0, { typedAt: null, mapPos: id, head: 4, empty: true }, doc("/t\nx"), newId)).toBeNull();
		expect(nextSlashSession(s0, { typedAt: null, mapPos: id, head: 0, empty: true }, doc("/t\nx"), newId)).toBeNull();
		expect(nextSlashSession(s0, { typedAt: null, mapPos: id, head: 2, empty: false }, doc("/t\nx"), newId)).toBeNull();
		expect(nextSlashSession(s0, { typedAt: null, mapPos: id, head: 3, empty: true }, doc("/t "), newId)).toBeNull();
		expect(nextSlashSession(s0, { typedAt: null, mapPos: id, head: 0, empty: true }, doc(""), newId)).toBeNull();
	});

	it("終わったあとにカーソルを / の後ろへ戻しても始まらない", () => {
		expect(nextSlashSession(null, { typedAt: null, mapPos: id, head: 1, empty: true }, doc("/t"), newId)).toBeNull();
	});

	it("前の行に文字が増えても、位置を写して続く", () => {
		const s0 = nextSlashSession(null, { typedAt: 2, mapPos: id, head: 3, empty: true }, doc("a\n/"), newId)!;
		const s1 = nextSlashSession(s0, { typedAt: null, mapPos: (p) => p + 1, head: 4, empty: true }, doc("ab\n/"), newId);
		expect(s1).toEqual({ id: s0.id, from: 3 });
	});
});

describe("nextTriggerSession（@、ADR-0067）", () => {
	let n = 100;
	const newId = () => ++n;
	const id = (p: number) => p;
	const at = (prev: ReturnType<typeof nextTriggerSession>, typedAt: number | null, head: number, text: string, empty = true) =>
		nextTriggerSession(AT_TRIGGER, prev, { typedAt, mapPos: id, head, empty }, doc(text), newId);

	it("行頭か、半角空白の直後に @ を打ったら始まる", () => {
		expect(at(null, 0, 1, "@")).toMatchObject({ from: 0 });
		expect(at(null, 4, 5, "abc @")).toMatchObject({ from: 4 });
		expect(at(null, 2, 3, "a\n@")).toMatchObject({ from: 2 });
	});

	it("文字の直後（メールアドレスなど）、全角空白やタブの後の @ では始まらない", () => {
		expect(at(null, 3, 4, "foo@")).toBeNull();
		expect(at(null, 1, 2, "　@")).toBeNull();
		expect(at(null, 1, 2, "\t@")).toBeNull();
	});

	it("続けて入力しているあいだは続き、空白・別の行・前の空白を消すと終わる", () => {
		const s0 = at(null, 2, 3, "a @")!;
		expect(at(s0, null, 7, "a @date")).toEqual(s0);
		expect(at(s0, null, 8, "a @date ")).toBeNull();
		expect(at(s0, null, 9, "a @date\nx")).toBeNull();
		expect(at(s0, null, 6, "a@date")).toBeNull();
	});
});

describe("inlineBody", () => {
	it("ファイルの終わりの改行だけを削る", () => {
		expect(inlineBody("{{prompt-date}}\n")).toBe("{{prompt-date}}");
		expect(inlineBody("a\r\n\r\n")).toBe("a");
		expect(inlineBody("a\nb\n")).toBe("a\nb");
		expect(inlineBody(" a ")).toBe(" a ");
	});
});
