import { describe, expect, it } from "vitest";
import { isBodyTag, isInlineCode } from "../src/core/targets.ts";

/** closest / matches だけを持つ、DOM の要素の代わり */
function el(own: string[], ancestors: string[] = []) {
	return {
		matches: (sel: string) => sel.split(",").some((s) => own.includes(s.trim())),
		closest: (sel: string) => (sel.split(",").some((s) => own.includes(s.trim()) || ancestors.includes(s.trim())) ? {} : null),
	};
}

describe("isInlineCode（コピーボタンを付けるコードか）", () => {
	it("pre の外の code は付ける", () => {
		expect(isInlineCode(el(["code"], ["p"]))).toBe(true);
	});
	it("コードブロック（pre の中の code）には付けない", () => {
		expect(isInlineCode(el(["code"], ["pre"]))).toBe(false);
	});
	it("code でなければ付けない", () => {
		expect(isInlineCode(el(["span"]))).toBe(false);
	});
});

describe("isBodyTag（文字に置き換える本文のタグか）", () => {
	it("本文の a.tag は置き換える", () => {
		expect(isBodyTag(el(["a.tag"], ["p"]))).toBe(true);
	});
	it("プロパティ欄（frontmatter の tags）のタグは置き換えない", () => {
		expect(isBodyTag(el(["a.tag"], [".metadata-container"]))).toBe(false);
		expect(isBodyTag(el(["a.tag"], [".frontmatter-container"]))).toBe(false);
	});
	it("タグでなければ置き換えない", () => {
		expect(isBodyTag(el(["a.internal-link"]))).toBe(false);
	});
});
