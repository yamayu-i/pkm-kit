import { describe, expect, it } from "vitest";
import { checkAuthTarget } from "../src/git/auth-target";
import { createHttpClient } from "../src/git/http";

describe("checkAuthTarget", () => {
	it.each([
		["https://github.com/o/r.git", "github.com"],
		["https://GitHub.com/o/r.git", " github.com "],
		["http://127.0.0.1:8080/r.git", "127.0.0.1"],
		["http://localhost/r.git", "localhost"],
	])("許可: %s (%s)", (url, host) => {
		expect(checkAuthTarget(url, host)).toBeNull();
	});

	it.each([
		["http://github.com/o/r.git", "github.com", "insecure-protocol"],
		["ssh://git@github.com/o/r.git", "github.com", "insecure-protocol"],
		["https://evil.example/o/r.git", "github.com", "host-mismatch"],
		["https://github.com.evil.example/r.git", "github.com", "host-mismatch"],
		["https://github.com@evil.example/r.git", "github.com", "host-mismatch"],
		["https://github.com/r.git", "", "host-mismatch"],
		["not a url", "github.com", "invalid-url"],
	])("拒否: %s (%s)", (url, host, reason) => {
		expect(checkAuthTarget(url, host)?.reason).toBe(reason);
	});

	it("エラーメッセージに URL 内の認証情報やパスを含めない", () => {
		const err = checkAuthTarget("http://user:secret@github.com/private/repo.git", "github.com"); // security-scan: allow
		expect(err?.message).toBe("https 以外の接続先には認証情報を送りません: http://github.com");
	});
});

describe("createHttpClient の送信前検査", () => {
	it("Authorization 付きのリクエストは、許可されていない接続先なら送らない", async () => {
		let called = 0;
		const http = createHttpClient(async () => {
			called++;
			return { status: 200, headers: {}, arrayBuffer: new ArrayBuffer(0) };
		}, "github.com");
		await expect(
			http.request({ url: "https://evil.example/r.git/info/refs", headers: { Authorization: "Basic eA==" } }),
		).rejects.toThrow("設定にないホスト");
		await expect(
			http.request({ url: "http://github.com/r.git/info/refs", headers: { authorization: "Basic eA==" } }),
		).rejects.toThrow("https 以外");
		expect(called).toBe(0);
		// 認証なしなら検査しない（公開リポジトリの初回アクセスなど）
		await http.request({ url: "https://evil.example/r.git/info/refs", headers: {} });
		expect(called).toBe(1);
	});
});
