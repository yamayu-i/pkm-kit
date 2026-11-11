import { describe, expect, it } from "vitest";
import { buildReport, hashText, type ReportComment } from "../src/runtime/report.ts";

const base: ReportComment = { id: "a", n: 3, title: "見出し", path: [0, 0], kind: "h2", line: 12, excerpt: "見出し", hash: "x", text: "短くしたい\n2 行目" };

describe("レビューのレポート（ADR-0117）", () => {
	it("デッキのパス、スライドの番号と見出し、部品の行、コメントを並べ、通し番号を振る", () => {
		const report = buildReport("slide/demo", "abc", [
			{ ...base, id: "c", n: 5, title: "後のスライド", path: null, kind: "slide", line: 30, excerpt: "", text: "全体に詰まっている" },
			base,
			{ ...base, id: "b", n: 0, title: "", path: null, kind: "deck", line: 0, excerpt: "", text: "順番を変えたい" },
			{ ...base, id: "d", kind: "div.card", line: 15, excerpt: "カード", state: "Updated", text: "色を変えたい" },
		]);
		expect(report).toBe(`# スライドのレビュー: slide/demo/deck.html

- コメント: 4 件
- ビルド: abc
- 頼みたいこと: slide スキルの review.md に従って slide/demo/deck.html を直し、\`node .kit/bin/slide.mjs build slide/demo\` でビルドし直してください。コメントごとに、どう直したか（直さなかったなら理由）を番号で返してください。

## デッキ全体

1. デッキ全体
   順番を変えたい

## スライド 3「見出し」

2. \`h2\`「見出し」（deck.html:12）
   短くしたい
   2 行目

3. \`div.card\`「カード」（deck.html:15） ※コメントの後に、この部品は変わっています
   色を変えたい

## スライド 5「後のスライド」

4. スライド全体（deck.html:30）
   全体に詰まっている
`);
	});

	it("hashText は同じ文字列に同じ値を返す", () => {
		expect(hashText("abc")).toBe(hashText("abc"));
		expect(hashText("abc")).not.toBe(hashText("abd"));
	});
});
