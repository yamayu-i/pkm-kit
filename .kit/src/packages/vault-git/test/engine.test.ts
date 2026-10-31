import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDevice, type Device } from "./helpers/device";
import { GitServer } from "./helpers/git-server";

describe("VaultGit (本物の git smart HTTP サーバーで検証)", () => {
	let server: GitServer;
	let pc: Device;
	let phone: Device;

	beforeEach(async () => {
		server = new GitServer();
		server.init({
			"note.md": "line1\nline2\nline3\n",
			".obsidian/app.json": '{\n  "a": 1\n}\n',
			"daily/2026-10-30.md": "old\n",
		});
		await server.start();
		pc = createDevice("pc");
		phone = createDevice("phone");
		await pc.git.clone(server.url, "main");
		await phone.git.clone(server.url, "main");
	});

	afterEach(async () => {
		pc.cleanup();
		phone.cleanup();
		await server.stop();
	});

	it("clone で作業ツリーが展開される", async () => {
		expect(await pc.read("note.md")).toBe("line1\nline2\nline3\n");
		expect(await pc.git.isRepo()).toBe(true);
	});

	it("push: 変更をコミットして push する", async () => {
		await pc.write("new.md", "hello\n");
		expect(await pc.git.push()).toEqual({ kind: "pushed", snapshot: true });
		expect(server.remoteFile("new.md")).toBe("hello\n");
		expect(server.remoteLog()[0]).toBe("vault: snapshot (pc)");
		expect(await pc.git.push()).toEqual({ kind: "nothing" });
	});

	it("push: behind があるときはコミットも push もしない", async () => {
		await phone.write("from-phone.md", "x\n");
		await phone.git.push();
		await pc.write("local.md", "y\n");
		expect(await pc.git.push()).toEqual({ kind: "behind" });
		expect(await pc.git.snapshot()).toBe(true); // 未コミットのまま残っていた
	});

	it("pull: fast-forward で取り込む（削除も反映）", async () => {
		await phone.write("from-phone.md", "x\n");
		await phone.store.remove("daily/2026-10-30.md");
		await phone.git.push();
		const res = await pc.git.pull();
		expect(res).toEqual({
			kind: "fast-forward",
			snapshot: false,
			changed: ["daily/2026-10-30.md", "from-phone.md"],
		});
		expect(await pc.read("from-phone.md")).toBe("x\n");
		expect(await pc.exists("daily")).toBe(false);
		expect(await pc.git.pull()).toEqual({ kind: "up-to-date", snapshot: false });
	});

	it("pull: 重ならない変更は自動でマージされる", async () => {
		await phone.write("note.md", "line1 phone\nline2\nline3\n");
		await phone.git.push();
		await pc.write("note.md", "line1\nline2\nline3 pc\n");
		const res = await pc.git.pull();
		expect(res.kind).toBe("merged");
		if (res.kind === "merged") expect(res.conflicts).toEqual([]);
		expect(await pc.read("note.md")).toBe("line1 phone\nline2\nline3 pc\n");
		expect(await pc.git.push()).toEqual({ kind: "pushed", snapshot: false });
		expect(server.remoteFile("note.md")).toBe("line1 phone\nline2\nline3 pc\n");
	});

	it("pull: md のコンフリクトはマーカー入りでコミットされ、そのまま push できる", async () => {
		await phone.write("note.md", "line1\nPHONE\nline3\n");
		await phone.git.push();
		await pc.write("note.md", "line1\nPC\nline3\n");
		const res = await pc.git.pull();
		expect(res).toMatchObject({ kind: "merged", conflicts: [{ path: "note.md", kind: "markers" }] });
		expect(await pc.read("note.md")).toBe(
			"line1\n<<<<<<< local (pc)\nPC\n=======\nPHONE\n>>>>>>> remote (origin/main)\nline3\n",
		);
		expect(await pc.git.snapshot()).toBe(false); // マーカー入りの状態がコミット済み
		expect((await pc.git.push()).kind).toBe("pushed");
		expect(server.remoteLog()[0]).toBe("vault: merge origin/main (pc)");
		expect(server.git("--git-dir=remote.git", "log", "-1", "--format=%B", "main")).toContain(
			"Conflicts:\n  note.md (markers)",
		);
	});

	it("pull: JSON のコンフリクトはリモート優先、ローカル版を別名で残す", async () => {
		await phone.write(".obsidian/app.json", '{\n  "a": 2\n}\n');
		await phone.git.push();
		await pc.write(".obsidian/app.json", '{\n  "a": 3\n}\n');
		const res = await pc.git.pull();
		const copy = ".obsidian/app (conflict pc 2026-10-31 1200).json";
		expect(res).toMatchObject({
			kind: "merged",
			conflicts: [{ path: ".obsidian/app.json", kind: "copy", copyPath: copy }],
		});
		expect(await pc.read(".obsidian/app.json")).toBe('{\n  "a": 2\n}\n');
		expect(await pc.read(copy)).toBe('{\n  "a": 3\n}\n');
	});

	it("pull: 削除 vs 編集は編集側を残す", async () => {
		await phone.store.remove("note.md");
		await phone.git.push();
		await pc.write("note.md", "edited\n");
		const res = await pc.git.pull();
		expect(res).toMatchObject({ kind: "merged", conflicts: [{ path: "note.md", kind: "kept-modified" }] });
		expect(await pc.read("note.md")).toBe("edited\n");
	});

	it("pull: 両方で同じデイリーノートを新規作成してもデータは消えない", async () => {
		await phone.write("daily/2026-10-31.md", "# 10/31\nphone\n");
		await phone.git.push();
		await pc.write("daily/2026-10-31.md", "# 10/31\npc\n");
		await pc.git.pull();
		const text = await pc.read("daily/2026-10-31.md");
		expect(text).toContain("phone");
		expect(text).toContain("pc");
		expect(text.startsWith("# 10/31\n")).toBe(true);
	});

	it("push: fetch 後に他端末が push したら rejected になり、pull 後は push できる", async () => {
		await phone.write("a.md", "a\n");
		await phone.git.push();
		await pc.write("b.md", "b\n");
		expect((await pc.git.push()).kind).toBe("behind");
		await pc.git.pull();
		expect((await pc.git.push()).kind).toBe("pushed");
		expect(server.remoteFile("a.md")).toBe("a\n");
		expect(server.remoteFile("b.md")).toBe("b\n");
	});

	it("認証情報がなければ失敗する", async () => {
		const anon = createDevice("anon", null);
		await expect(anon.git.clone(server.url, "main")).rejects.toThrow();
		anon.cleanup();
	});
});
