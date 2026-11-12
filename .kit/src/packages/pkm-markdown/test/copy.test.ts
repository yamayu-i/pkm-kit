import { describe, expect, it } from "vitest";
import { copyText } from "../src/core/copy.ts";

describe("copyText（クリップボードに書いて、結果を知らせる）", () => {
	it("書けたら成功を知らせ、true を返す", async () => {
		const written: string[] = [];
		const notes: string[] = [];
		const ok = await copyText("git status", { writeText: async (t) => void written.push(t) }, (m) => notes.push(m));
		expect(ok).toBe(true);
		expect(written).toEqual(["git status"]);
		expect(notes).toEqual(["コピーしました"]);
	});

	it("書けなければ失敗を知らせ、false を返す（成功したふりをしない）", async () => {
		const notes: string[] = [];
		const ok = await copyText("x", { writeText: async () => Promise.reject(new Error("denied")) }, (m) => notes.push(m));
		expect(ok).toBe(false);
		expect(notes).toEqual(["コピーできませんでした"]);
	});

	it("クリップボードがない環境でも失敗を知らせる", async () => {
		const notes: string[] = [];
		expect(await copyText("x", undefined, (m) => notes.push(m))).toBe(false);
		expect(notes).toEqual(["コピーできませんでした"]);
	});
});
