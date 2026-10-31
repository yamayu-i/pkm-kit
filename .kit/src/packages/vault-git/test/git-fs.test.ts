import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createGitFs } from "../src/fs/git-fs";
import { NodeFileStore } from "./helpers/node-store";

describe("createGitFs", () => {
	const root = mkdtempSync(join(tmpdir(), "vault-git-fs-"));
	const fs = createGitFs(new NodeFileStore(root)).promises;
	afterEach(() => rmSync(root, { recursive: true, force: true }));

	it("Node の fs と同じエラーコードを返す", async () => {
		await expect(fs.readFile("/nope")).rejects.toMatchObject({ code: "ENOENT" });
		await expect(fs.stat("/nope")).rejects.toMatchObject({ code: "ENOENT" });
		await fs.mkdir("/d");
		await expect(fs.mkdir("/d")).rejects.toMatchObject({ code: "EEXIST" });
		await fs.writeFile("/d/f", "x");
		await expect(fs.rmdir("/d")).rejects.toMatchObject({ code: "ENOTEMPTY" });
		await expect(fs.readdir("/d/f")).rejects.toMatchObject({ code: "ENOTDIR" });
		await expect(fs.symlink?.("a", "/l")).rejects.toMatchObject({ code: "ENOSYS" });
	});

	it("utf8 指定で文字列、それ以外はバイト列を返す", async () => {
		await fs.writeFile("/a.txt", "あ");
		expect(await fs.readFile("/a.txt", { encoding: "utf8" })).toBe("あ");
		expect(await fs.readFile("/a.txt")).toBeInstanceOf(Uint8Array);
		expect((await fs.stat("/a.txt")).isFile()).toBe(true);
		expect(await fs.readdir("/")).toContain("a.txt");
	});
});
