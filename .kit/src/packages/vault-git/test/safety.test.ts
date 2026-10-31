import { describe, expect, it } from "vitest";
import { redactSecrets } from "../src/git/http";
import { isSafeWorktreePath } from "../src/merge/path-safety";

describe("isSafeWorktreePath", () => {
	it.each(["note.md", "a/b.md", ".obsidian/app.json", "日本語/ノート.md"])("許可: %s", (p) => {
		expect(isSafeWorktreePath(p)).toBe(true);
	});
	it.each(["", "/etc/passwd", "../x", "a/../../x", ".git/config", "a/.GIT/hooks/x", "C:/x", "a\\b", "a//b", "./a"])(
		"拒否: %s",
		(p) => {
			expect(isSafeWorktreePath(p)).toBe(false);
		},
	);
});

describe("redactSecrets", () => {
	it("URL の認証情報とトークンを伏せる", () => {
		expect(redactSecrets("GET https://user:ghp_abc@github.com/x failed ghp_abc", ["ghp_abc"])).toBe(
			"GET https://***@github.com/x failed ***",
		);
	});
});
