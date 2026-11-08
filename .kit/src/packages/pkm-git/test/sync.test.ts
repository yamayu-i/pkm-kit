import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APPLY_JOURNAL, ApplyJournalError } from "../src/git/engine";
import { createDevice, type Device } from "./helpers/device";
import { GitServer } from "./helpers/git-server";

/** 端末のローカルのコミットのメッセージ（新しい順） */
function localLog(device: Device): string[] {
	return execFileSync("git", ["log", "--format=%s", "main"], { cwd: device.root, encoding: "utf8" }).trim().split("\n");
}

const NOTE = "---\ntitle: n\ncreated: 2026-10-01T00:00:00+09:00\nupdated: 2026-10-01T00:00:00+09:00\n---\nbody\n";

describe("sync（ADR-0089）", () => {
	let server: GitServer;
	let pc: Device;
	let phone: Device;
	let onTiming: (phase: string) => void;

	beforeEach(async () => {
		onTiming = () => {};
		server = new GitServer();
		server.init({ "note.md": "line1\nline2\nline3\n", "a.md": "a\n", "b.md": "b\n", "asset/img.png": "png" });
		await server.start();
		pc = createDevice("pc", undefined, undefined, (phase) => onTiming(phase));
		phone = createDevice("phone");
		await pc.git.clone(server.url, "main");
		await phone.git.clone(server.url, "main");
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		pc.cleanup();
		phone.cleanup();
		await server.stop();
	});

	it("編集を 1 回の同期で送り、変更がなければ何もしない", async () => {
		await pc.write("new.md", "hello\n");
		const res = await pc.git.sync();
		expect(res).toMatchObject({ status: "shared", snapshot: true, attempts: 1, recovery: null });
		expect(server.remoteFile("new.md")).toBe("hello\n");
		expect(await pc.git.sync()).toMatchObject({ status: "shared", snapshot: false, attempts: 0 });
		expect(await pc.git.shareState()).toEqual({ unpushed: false, changed: [] });
	});

	it("リモートが先に進んでいても止めずに取り込んでから送る", async () => {
		await phone.write("from-phone.md", "x\n");
		await phone.git.sync();
		await pc.write("local.md", "y\n");
		const res = await pc.git.sync();
		expect(res.status).toBe("shared");
		expect(res.changed).toEqual(["from-phone.md"]);
		expect(await pc.read("from-phone.md")).toBe("x\n");
		expect(server.remoteFile("local.md")).toBe("y\n");
	});

	it("L1: オフラインで編集と同期を繰り返してもコミットが増えず、届いたときに 1 つの snapshot にまとまる", async () => {
		const before = localLog(pc).length;
		pc.setOffline(true);
		for (let i = 0; i < 5; i++) {
			await pc.write("draft.md", `draft ${i}\n`);
			expect((await pc.git.sync()).status).toBe("offline");
		}
		expect(localLog(pc)).toHaveLength(before);
		pc.setOffline(false);
		expect((await pc.git.sync()).status).toBe("shared");
		expect(localLog(pc)).toHaveLength(before + 1);
		expect(server.remoteFile("draft.md")).toBe("draft 4\n");
	});

	it("push の途中でつながらなくなったら、コミットを残してオフラインになり、次に送る", async () => {
		await pc.write("x.md", "x\n");
		onTiming = (phase) => { if (phase === "snapshot") pc.setOffline(true); };
		expect((await pc.git.sync()).status).toBe("offline");
		expect(await pc.git.shareState()).toMatchObject({ unpushed: true });
		onTiming = () => {};
		pc.setOffline(false);
		expect(await pc.git.sync()).toMatchObject({ status: "shared", snapshot: false });
		expect(server.remoteFile("x.md")).toBe("x\n");
	});

	it("この版を残す: オフラインでも名前付きでコミットし、次に届いた同期で送る", async () => {
		pc.setOffline(true);
		await pc.write("trip.md", "plan\n");
		const res = await pc.git.sync({ keep: "旅行の\n計画" });
		expect(res).toMatchObject({ status: "offline", snapshot: true });
		expect(localLog(pc)[0]).toBe("vault: keep 旅行の 計画 (pc)");
		pc.setOffline(false);
		expect((await pc.git.sync()).status).toBe("shared");
		expect(server.remoteLog()[0]).toBe("vault: keep 旅行の 計画 (pc)");
	});

	it("この版を残す: 変更がなければコミットしない", async () => {
		const before = localLog(pc).length;
		expect(await pc.git.sync({ keep: "" })).toMatchObject({ status: "shared", snapshot: false });
		expect(localLog(pc)).toHaveLength(before);
	});

	it("認証に失敗したら接続を確認の状態にし、コミットしない", async () => {
		const bad = createDevice("bad", "wrong-token");
		try {
			await bad.store.write("x", new Uint8Array());
			// clone は正しいトークンの端末から .git を写して作る
			execFileSync("cp", ["-r", `${pc.root}/.git`, bad.root]);
			execFileSync("git", ["checkout", "-q", "--", "."], { cwd: bad.root });
			await bad.write("y.md", "y\n");
			const before = localLog(bad).length;
			expect((await bad.git.sync()).status).toBe("auth");
			expect(localLog(bad)).toHaveLength(before);
		} finally {
			bad.cleanup();
		}
	});

	/** pc の snapshot の後（fetch と push の間）に、phone が先に送る */
	function raceAfterSnapshot(times: number): void {
		const real = pc.git.snapshot.bind(pc.git);
		let n = 0;
		vi.spyOn(pc.git, "snapshot").mockImplementation(async (message?: string) => {
			const committed = await real(message);
			if (n < times) {
				n++;
				await phone.write(`race-${n}.md`, `${n}\n`);
				expect((await phone.git.sync()).status).toBe("shared");
			}
			return committed;
		});
	}

	it("S4・U1: 送る前に他の端末が送ったら取り込み直して送る。snapshot と updated を付け直さない", async () => {
		await pc.write("n.md", NOTE);
		await pc.git.sync();
		await phone.git.sync();
		await pc.write("n.md", NOTE.replace("body", "body pc"));
		raceAfterSnapshot(1);
		const res = await pc.git.sync();
		expect(res).toMatchObject({ status: "shared", attempts: 2, snapshot: true });
		expect(localLog(pc).filter((m) => m === "vault: snapshot (pc)")).toHaveLength(2);
		expect(server.remoteFile("race-1.md")).toBe("1\n");
		expect(server.remoteFile("n.md")).toContain("body pc");
	});

	it("S4: 拒否が続いたら 3 回で止め、force push せずに共有待ちにする", async () => {
		await pc.write("p.md", "p\n");
		raceAfterSnapshot(3);
		const res = await pc.git.sync();
		expect(res).toMatchObject({ status: "pending", reason: "rejected", attempts: 3 });
		for (const n of [1, 2, 3]) expect(server.remoteFile(`race-${n}.md`)).toBe(`${n}\n`);
		vi.restoreAllMocks();
		expect((await pc.git.sync()).status).toBe("shared");
		expect(server.remoteFile("p.md")).toBe("p\n");
		expect(server.remoteFile("race-3.md")).toBe("3\n");
	});

	it("同期中に取り込むファイルを編集したら上書きせず、共有待ちで返す。次の同期で両方が残る", async () => {
		await phone.write("note.md", "line1 phone\nline2\nline3\n");
		await phone.git.sync();
		onTiming = (phase) => {
			if (phase !== "merge-base") return;
			onTiming = () => {};
			// 取り込みの直前の編集
			writeFileSync(join(pc.root, "note.md"), "line1\nline2\nline3 pc\n");
		};
		const res = await pc.git.sync();
		expect(res).toMatchObject({ status: "pending", reason: "worktree-changed", paths: ["note.md"] });
		expect(await pc.read("note.md")).toBe("line1\nline2\nline3 pc\n");
		expect((await pc.git.sync()).status).toBe("shared");
		expect(await pc.read("note.md")).toBe("line1 phone\nline2\nline3 pc\n");
	});

	it("U2: 同期中に外（Git の CLI）がコミットしたら、ブランチを書き換えずに共有待ちで返す", async () => {
		await phone.write("from-phone.md", "x\n");
		await phone.git.sync();
		onTiming = (phase) => {
			if (phase !== "merge-base") return;
			onTiming = () => {};
			execFileSync("git", ["-C", pc.root, "-c", "user.name=cli", "-c", "user.email=c@l", "commit", "-q", "--allow-empty", "-m", "cli commit"]);
		};
		const res = await pc.git.sync();
		expect(res).toMatchObject({ status: "pending", reason: "branch-moved" });
		expect(localLog(pc)[0]).toBe("cli commit");
		expect((await pc.git.sync()).status).toBe("shared");
		expect(server.remoteLog()).toContain("cli commit");
		expect(await pc.read("from-phone.md")).toBe("x\n");
	});

	describe("S1: 取り込みの途中で落ちたとき", () => {
		async function crashDuringApply(): Promise<void> {
			await phone.write("a.md", "a phone\n");
			await phone.write("b.md", "b phone\n");
			await phone.git.sync();
			const realWrite = pc.store.write.bind(pc.store);
			let writes = 0;
			const spy = vi.spyOn(pc.store, "write").mockImplementation(async (path, data) => {
				if (!path.startsWith(".git/") && ++writes === 2) throw new Error("app killed");
				return realWrite(path, data);
			});
			await expect(pc.git.sync()).rejects.toThrow("app killed");
			spy.mockRestore();
			expect(await pc.exists(APPLY_JOURNAL)).toBe(true);
		}

		it("次の同期が書きかけを揃えてブランチを進める。不要なコミットを作らない", async () => {
			await crashDuringApply();
			const before = localLog(pc);
			const res = await pc.git.sync();
			expect(res.recovery).toEqual({ action: "completed", paths: ["a.md", "b.md"] });
			expect(res).toMatchObject({ status: "shared", snapshot: false });
			expect(await pc.read("a.md")).toBe("a phone\n");
			expect(await pc.read("b.md")).toBe("b phone\n");
			expect(await pc.exists(APPLY_JOURNAL)).toBe(false);
			expect(localLog(pc).length).toBe(before.length + 1); // fast-forward した phone のコミットだけ
			expect(await pc.git.shareState()).toEqual({ unpushed: false, changed: [] });
		});

		it("落ちた後に編集されたパスがあれば、ブランチを進めずに snapshot とマージに任せ、両方を残す", async () => {
			await crashDuringApply();
			const halfApplied = await pc.read("a.md");
			await pc.write("a.md", `${halfApplied}pc line\n`);
			const res = await pc.git.sync();
			expect(res.recovery).toEqual({ action: "fallback", paths: ["a.md"] });
			expect(res.status).toBe("shared");
			expect(await pc.read("a.md")).toContain("pc line");
			expect(await pc.read("b.md")).toBe("b phone\n");
			expect(server.remoteFile("a.md")).toContain("pc line");
		});

		it("記録の版が読めなければ記録を消し、今の振る舞い（snapshot とマージ）で続ける", async () => {
			const head = (await pc.read(".git/refs/heads/main")).trim();
			await pc.store.write(APPLY_JOURNAL, new TextEncoder().encode(
				JSON.stringify({ schemaVersion: 1, branch: "main", from: head, to: "0".repeat(40) }),
			));
			await pc.write("x.md", "x\n");
			const res = await pc.git.sync();
			expect(res).toMatchObject({ status: "shared", recovery: { action: "discarded" } });
			expect(await pc.exists(APPLY_JOURNAL)).toBe(false);
			expect(server.remoteFile("x.md")).toBe("x\n");
		});

		it("知らない形の記録なら何もせずに止まり、記録を消さない", async () => {
			await pc.store.write(APPLY_JOURNAL, new TextEncoder().encode('{"schemaVersion":99}'));
			await expect(pc.git.sync()).rejects.toBeInstanceOf(ApplyJournalError);
			expect(await pc.exists(APPLY_JOURNAL)).toBe(true);
		});
	});

	it("L3・共有の状態: 読むだけのファイルと .gitignore に当たるファイルは変更にならない", async () => {
		await pc.write(".gitignore", "tmp/\n");
		await pc.git.sync();
		await pc.store.read("asset/img.png");
		await pc.write("tmp/share.html", "x");
		expect(await pc.git.shareState(["asset/img.png", "tmp/share.html"])).toEqual({ unpushed: false, changed: [] });
		await pc.write("a.md", "edited\n");
		expect(await pc.git.shareState(["a.md", "asset/img.png"])).toEqual({ unpushed: false, changed: ["a.md"] });
		await pc.store.remove("b.md");
		expect((await pc.git.shareState()).changed).toEqual(["a.md", "b.md"]);
	});
});
