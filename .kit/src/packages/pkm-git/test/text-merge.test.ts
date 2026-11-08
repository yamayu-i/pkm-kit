import { describe, expect, it } from "vitest";
import { hasConflictMarkers, mergeText } from "../src/merge/text-merge";

const labels = { ours: "local (pc)", theirs: "remote (origin/main)" };

describe("mergeText", () => {
	it("重ならない変更はきれいにマージする", () => {
		expect(mergeText("a\nb\nc\n", "A\nb\nc\n", "a\nb\nC\n", labels)).toEqual({ clean: true, text: "A\nb\nC\n" });
	});

	it("同じ変更はコンフリクトにしない", () => {
		expect(mergeText("a\n", "b\n", "b\n", labels)).toEqual({ clean: true, text: "b\n" });
	});

	it("重なる変更はマーカーで両方残す", () => {
		const r = mergeText("a\nx\nc\n", "a\nours\nc\n", "a\ntheirs\nc\n", labels);
		expect(r.clean).toBe(false);
		expect(r.text).toBe("a\n<<<<<<< local (pc)\nours\n=======\ntheirs\n>>>>>>> remote (origin/main)\nc\n");
		expect(hasConflictMarkers(r.text)).toBe(true);
	});

	it("末尾に改行がなくてもマーカーは行頭に来る", () => {
		const r = mergeText("x", "ours", "theirs", labels);
		expect(r.text).toBe("<<<<<<< local (pc)\nours\n=======\ntheirs\n>>>>>>> remote (origin/main)\n");
	});

	it("新規作成同士は共通の先頭・末尾をマーカーの外に出す", () => {
		const r = mergeText("", "# title\npc\nfooter\n", "# title\nphone\nfooter\n", labels);
		expect(r.text).toBe(
			"# title\n<<<<<<< local (pc)\npc\n=======\nphone\n>>>>>>> remote (origin/main)\nfooter\n",
		);
	});

	it("マーカーのないテキストは未解決扱いにしない", () => {
		expect(hasConflictMarkers("<<<<<<<\nなし")).toBe(false);
	});
});
