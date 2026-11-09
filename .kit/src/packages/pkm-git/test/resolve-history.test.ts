import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { describeCommit } from "../src/git/engine";
import { mergeText, parseConflicts, resolveConflicts } from "../src/merge/text-merge";
import { originalOfConflictCopy } from "../src/merge/tree-merge";
import { createDevice, type Device } from "./helpers/device";
import { GitServer } from "./helpers/git-server";

const labels = { ours: "local (pc)", theirs: "remote (origin/main)" };

describe("マーカーの塊を選んで解く（ADR-0110 の 1）", () => {
	const merged = mergeText(
		"head\na\nmiddle\nb\ntail\n",
		"head\na-local\nmiddle\nb-local\ntail\n",
		"head\na-remote\nmiddle\nb-remote\ntail\n",
		labels,
	).text;

	it("塊と、その外の本文に分ける", () => {
		const segments = parseConflicts(merged);
		expect(segments).toEqual([
			{ type: "text", text: "head\n" },
			{ type: "conflict", localLabel: "local (pc)", remoteLabel: "remote (origin/main)", local: "a-local\n", remote: "a-remote\n" },
			{ type: "text", text: "middle\n" },
			{ type: "conflict", localLabel: "local (pc)", remoteLabel: "remote (origin/main)", local: "b-local\n", remote: "b-remote\n" },
			{ type: "text", text: "tail\n" },
		]);
	});

	it("塊ごとに選んだ本文で置き換え、塊の外は変えない", () => {
		const segments = parseConflicts(merged) ?? [];
		expect(resolveConflicts(segments, ["local", "remote"])).toBe("head\na-local\nmiddle\nb-remote\ntail\n");
		expect(resolveConflicts(segments, ["both", "local"])).toBe("head\na-local\na-remote\nmiddle\nb-local\ntail\n");
		expect(() => resolveConflicts(segments, ["local"])).toThrow();
	});

	it("片側が空の塊と、改行で終わらない本文", () => {
		const segments = parseConflicts("<<<<<<< local\n=======\nonly remote\n>>>>>>> remote\nend") ?? [];
		expect(resolveConflicts(segments, ["local"])).toBe("end");
		expect(resolveConflicts(segments, ["both"])).toBe("only remote\nend");
	});

	it("塊の外の ======= は本文として扱う（Setext の見出し）", () => {
		expect(parseConflicts("Title\n=======\nbody\n")).toEqual([{ type: "text", text: "Title\n=======\nbody\n" }]);
	});

	it("形の崩れた塊は読まない", () => {
		expect(parseConflicts("<<<<<<< a\nx\n=======\ny\n")).toBeNull();
		expect(parseConflicts("<<<<<<< a\nx\n>>>>>>> b\n")).toBeNull();
		expect(parseConflicts("<<<<<<< a\nx\n=======\ny\n=======\nz\n>>>>>>> b\n")).toBeNull();
		expect(parseConflicts("<<<<<<< a\n<<<<<<< b\nx\n=======\ny\n>>>>>>> c\n")).toBeNull();
	});
});

describe("別名の版の元のファイル（ADR-0110 の 2）", () => {
	it("名前から ` (conflict …)` を除く", () => {
		expect(originalOfConflictCopy("notes/a (conflict pc 2026-10-31 1200).md")).toBe("notes/a.md");
		expect(originalOfConflictCopy("asset/fig (conflict pc 2026-10-31 1200 2).drawio.svg")).toBe("asset/fig.drawio.svg");
		expect(originalOfConflictCopy("data (conflict pc 2026-10-31 1200)")).toBe("data");
		expect(originalOfConflictCopy("notes/a.md")).toBeNull();
	});
});

describe("版の種類（ADR-0110 の 3）", () => {
	const c = (message: string) => describeCommit("x", { message, author: { name: "pc", timestamp: 1 } });
	it("PKM Git のコミットメッセージから読む", () => {
		expect(c("vault: snapshot (pc)\n")).toMatchObject({ kind: "synced", author: "pc", time: 1000 });
		expect(c("vault: keep draft 1 (pc)\n")).toMatchObject({ kind: "kept", name: "draft 1" });
		expect(c("vault: keep (pc)\n")).toMatchObject({ kind: "kept", name: "" });
		expect(c("vault: merge origin/main (pc)\n\nConflicts:\n")).toMatchObject({ kind: "merged" });
		expect(c("fix typo\n")).toMatchObject({ kind: "other" });
	});
});

describe("ファイルの履歴と、前の版に戻す（ADR-0110 の 3・4）", () => {
	let server: GitServer;
	const devices: Device[] = [];
	const device = (name: string): Device => {
		const d = createDevice(name);
		devices.push(d);
		return d;
	};

	beforeEach(async () => {
		server = new GitServer();
		server.init({ "note.md": "v0\n", "other.md": "o\n" });
		const seed = join(server.root, "seed");
		for (let i = 1; i <= 40; i++) {
			// note.md は 1 つおきに変える
			writeFileSync(join(seed, i % 2 === 0 ? "note.md" : "other.md"), `v${i}\n`);
			execFileSync("git", ["-C", seed, "-c", "user.name=seed", "-c", "user.email=s@s", "commit", "-qam", `c${i}`]);
		}
		execFileSync("git", ["-C", seed, "push", "-q", "--force", join(server.root, "remote.git"), "HEAD:refs/heads/main"]);
		await server.start();
	});

	afterEach(async () => {
		for (const d of devices.splice(0)) d.cleanup();
		await server.stop();
	});

	it("そのファイルを変えたコミットだけを新しい順に出し、続きを読める", async () => {
		const pc = device("pc");
		await pc.git.clone(server.url, "main");
		// shallow の端末の履歴を取り足して、全部を手元に持たせる
		while ((await pc.git.deepen(30)) === "deepened");
		await pc.write("note.md", "pc edit\n");
		await pc.git.sync({ keep: "draft" });

		// note.md を変えたのは、初めのコミット・偶数の 20 個・pc の 1 個の 22 個
		const first = await pc.git.fileHistory("note.md", { limit: 10 });
		expect(first.versions).toHaveLength(10);
		expect(first.versions[0]).toMatchObject({ kind: "kept", name: "draft", author: "pc" });
		expect(first.versions[1]).toMatchObject({ kind: "other", author: "seed" });
		expect(first.atStart).toBe(false);
		const rest = await pc.git.fileHistory("note.md", { skip: 10 });
		expect(rest.versions).toHaveLength(12);
		expect(new Set([...first.versions, ...rest.versions].map((v) => v.commit)).size).toBe(22);
		expect(rest.atStart).toBe(true);
		expect(rest.canDeepen).toBe(false);
		expect(new TextDecoder().decode((await pc.git.readVersion(first.versions[1]?.commit as string, "note.md")) as Uint8Array)).toBe("v40\n");
	});

	it("最新の版だけを持つ端末で、履歴の始まりから取り足して、より前の版を出す", async () => {
		const sh = device("sh");
		await sh.git.clone(server.url, "main");
		const first = await sh.git.fileHistory("note.md");
		expect(first).toMatchObject({ atStart: true, canDeepen: true });
		expect(first.versions).toHaveLength(1);
		expect(await sh.git.deepen(30)).toBe("deepened");
		const next = await sh.git.fileHistory("note.md");
		expect(next.versions.length).toBeGreaterThan(10);
		// 取り足した後も同期できる
		await sh.write("x.md", "x\n");
		expect((await sh.git.sync()).status).toBe("shared");
		sh.setOffline(true);
		expect(await sh.git.deepen(30)).toBe("offline");
	});

	it("戻す前に今の内容をコミットし、戻した内容を次の同期で共有する", async () => {
		const pc = device("pc");
		await pc.git.clone(server.url, "main");
		await pc.git.deepen(30);
		const old = (await pc.git.fileHistory("note.md")).versions[3];
		await pc.write("note.md", "unsaved edit\n");
		expect(await pc.git.snapshotBeforeRestore("note.md")).toBe(true);
		const kept = (await pc.git.fileHistory("note.md")).versions[0];
		expect(kept).toMatchObject({ kind: "kept", name: "before restore note.md" });
		expect(new TextDecoder().decode((await pc.git.readVersion(kept?.commit as string, "note.md")) as Uint8Array)).toBe("unsaved edit\n");

		await pc.store.write("note.md", (await pc.git.readVersion(old?.commit as string, "note.md")) as Uint8Array);
		expect((await pc.git.sync()).status).toBe("shared");
		expect(server.remoteFile("note.md")).toBe("v34\n");
	});
});
