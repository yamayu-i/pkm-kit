import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { newMemberContent } from "../src/core/issue-file";
import { memberExactly, memberLabel, memberMatches, memberQuery } from "../src/core/member";
import { parseMember, type Member } from "../src/core/schema";

const member = (over: Partial<Member> = {}): Member => ({ path: "member/m-3.md", id: "m-3", name: "田中 太郎", nickname: "たなぽん", alias: "tanapon", created: null, ...over });

describe("parseMember（ADR-0035）", () => {
	it("name / nickname / alias を読む", () => {
		const { value, problems } = parseMember("member/m-3.md", { type: "member", id: "m-3", name: "田中 太郎", nickname: "たなぽん", alias: "tanapon" });
		expect(problems).toEqual([]);
		expect(value).toMatchObject({ id: "m-3", name: "田中 太郎", nickname: "たなぽん", alias: "tanapon" });
	});

	it("nickname がなければ name、alias がなければ ID を使う", () => {
		const { value, problems } = parseMember("member/m-1.md", { type: "member", id: "m-1", name: "佐藤", nickname: "", alias: null });
		expect(problems).toEqual([]);
		expect(value).toMatchObject({ name: "佐藤", nickname: "佐藤", alias: "m-1" });
	});

	it("alias が文字列でなければ問題にし、ID を使う", () => {
		const { value, problems } = parseMember("member/m-2.md", { type: "member", id: "m-2", name: "鈴木", alias: ["a", "b"] });
		expect(value?.alias).toBe("m-2");
		expect(problems.map((p) => p.code)).toEqual(["invalid-field"]);
	});

	it("alias の先頭の @ は付けずに持つ", () => {
		const { value } = parseMember("member/m-2.md", { type: "member", id: "m-2", name: "鈴木", alias: "@suzu" });
		expect(value?.alias).toBe("suzu");
	});
});

describe("member の表示と検索（ADR-0035）", () => {
	it("候補は @alias - nickname (name) の形", () => {
		expect(memberLabel(member())).toBe("@tanapon - たなぽん (田中 太郎)");
	});

	it("alias / nickname / name / ID の部分一致で探す。大文字小文字と先頭の @ は無視する", () => {
		const m = member();
		for (const q of ["tana", "@TANA", "ぽん", "太郎", "m-3", ""]) expect(memberMatches(m, q), q).toBe(true);
		expect(memberMatches(m, "yamada")).toBe(false);
	});

	it("完全一致は alias / nickname / name のどれか", () => {
		const m = member();
		expect(memberExactly(m, "@Tanapon")).toBe(true);
		expect(memberExactly(m, "たなぽん")).toBe(true);
		expect(memberExactly(m, "田中 太郎")).toBe(true);
		expect(memberExactly(m, "田中")).toBe(false);
	});

	it("検索語の正規化", () => {
		expect(memberQuery("  @Tana ")).toBe("tana");
	});
});

describe("newMemberContent（ADR-0035）", () => {
	it("name と nickname に登録名、alias に ID を入れる", () => {
		const created = "2026-11-07T09:00:00+09:00";
		const fm = parse(/^---\n([\s\S]*?)\n---/.exec(newMemberContent("m-4", "山田", created))![1]!) as Record<string, unknown>;
		expect(fm).toEqual({ schema: 1, type: "member", id: "m-4", name: "山田", nickname: "山田", alias: "m-4", created, updated: created });
	});
});
