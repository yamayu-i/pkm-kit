import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { sha256 } from "../src/sha256.ts";

const node = (text: string, encoding: "hex" | "base64") => createHash("sha256").update(text).digest(encoding);

describe("sha256（ADR-0132）", () => {
	it("Node の crypto と同じ値を返す（長さの境目、多バイト文字、長い入力）", () => {
		const inputs = ["", "a", "abc", "日本語のノート", "😀 emoji", "x".repeat(55), "x".repeat(56), "x".repeat(63), "x".repeat(64), "x".repeat(65), "<p>話すこと</p>\n".repeat(5000)];
		for (const text of inputs) {
			expect(sha256(text, "hex")).toBe(node(text, "hex"));
			expect(sha256(text, "base64")).toBe(node(text, "base64"));
		}
	});
});
