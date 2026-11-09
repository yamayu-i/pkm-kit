import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import git from "isomorphic-git";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	CONFLICT_RECORD_DIR, listConflictRecords, parseConflictRecord, removeConflictRecord,
} from "../src/git/conflict-records";
import { commonBaseTree } from "../src/merge/tree-merge";
import { createDevice, type Device } from "./helpers/device";
import { GitServer } from "./helpers/git-server";
import { NodeFileStore } from "./helpers/node-store";

const OID = "a".repeat(40);
const VALID = {
	schemaVersion: 1, kind: "kept-modified", path: "a.md", deleted: "remote", device: "phone",
	at: "2026-10-31T12:00:00+09:00", local: OID, remote: OID, bases: [OID],
};

function cli(device: Device, ...args: string[]): string {
	return execFileSync("git", ["-C", device.root, "-c", "user.name=cli", "-c", "user.email=c@l", ...args], { encoding: "utf8" }).trim();
}

describe("衝突の記録の形（ADR-0103 の 2）", () => {
	it("正しい記録を読み、形の違う記録を理由つきで拒む", () => {
		expect(parseConflictRecord(JSON.stringify(VALID))).toEqual(VALID);
		expect(() => parseConflictRecord("{")).toThrow("JSON");
		expect(() => parseConflictRecord(JSON.stringify({ ...VALID, schemaVersion: 2 }))).toThrow("schemaVersion");
		expect(() => parseConflictRecord(JSON.stringify({ ...VALID, path: "../x.md" }))).toThrow("path");
		expect(() => parseConflictRecord(JSON.stringify({ ...VALID, path: ".git/config" }))).toThrow("path");
		expect(() => parseConflictRecord(JSON.stringify({ ...VALID, path: ".pkm-git/conflicts/x.json" }))).toThrow("path");
		expect(() => parseConflictRecord(JSON.stringify({ ...VALID, bases: ["x"] }))).toThrow("コミット");
	});

	it("記録のフォルダの外は消さない", async () => {
		const store = new NodeFileStore(execFileSync("mktemp", ["-d"], { encoding: "utf8" }).trim());
		await store.write("a.md", new TextEncoder().encode("a"));
		await expect(removeConflictRecord(store, "a.md")).rejects.toThrow("衝突の記録ではありません");
		await expect(removeConflictRecord(store, `${CONFLICT_RECORD_DIR}/../../a.md`)).rejects.toThrow();
		expect(await store.stat("a.md")).not.toBeNull();
	});

	it("共通祖先が複数あるときは、すべての祖先で同じパスだけを残す（ADR-0103 の 4）", () => {
		const e = (oid: string) => ({ oid, mode: "100644" });
		const base = commonBaseTree([
			new Map([["same", e("1")], ["differ", e("1")], ["only-first", e("1")]]),
			new Map([["same", e("1")], ["differ", e("2")], ["only-second", e("1")]]),
		]);
		expect([...base.keys()]).toEqual(["same"]);
	});
});

describe("衝突の記録と同期（ADR-0103）", () => {
	let server: GitServer;
	let pc: Device;
	let phone: Device;

	beforeEach(async () => {
		server = new GitServer();
		server.init({ "a.md": "a\n", "b.md": "b\n", "f.md": "v0\n" });
		await server.start();
		pc = createDevice("pc");
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

	/** pc で a.md を消し、phone で a.md を編集して、phone がマージする */
	async function deleteVsEdit(): Promise<string> {
		await pc.store.remove("a.md");
		expect((await pc.git.sync()).status).toBe("shared");
		await phone.write("a.md", "edited\n");
		const res = await phone.git.sync();
		expect(res.status).toBe("shared");
		expect(res.conflicts).toMatchObject([{ path: "a.md", kind: "kept-modified", deleted: "remote" }]);
		return res.conflicts[0]?.recordPath as string;
	}

	it("削除と編集の衝突で、記録をマージのコミットに入れ、ほかの端末に届ける", async () => {
		const file = await deleteVsEdit();
		expect(file).toMatch(/^\.pkm-git\/conflicts\/\d{8}T\d{6}Z-[0-9a-f]{8}\.json$/);
		// 記録はマージのコミットそのものに入っている
		expect(cli(phone, "show", "--name-only", "--format=%s", "HEAD")).toContain(file);
		expect(cli(phone, "log", "-1", "--format=%P", "HEAD").split(" ")).toHaveLength(2);
		expect(JSON.parse(server.remoteFile(file))).toMatchObject({ path: "a.md", deleted: "remote", device: "phone" });

		await pc.git.sync();
		expect(await pc.read("a.md")).toBe("edited\n");
		// 作り直した store（再起動）でも同じ記録を読める
		expect(await listConflictRecords(new NodeFileStore(pc.root))).toMatchObject([{ file, record: { path: "a.md" } }]);
	});

	it("記録を消して（Keep）同期すると、ほかの端末からも消える。2 台が同時に消しても衝突しない", async () => {
		const file = await deleteVsEdit();
		await pc.git.sync();
		await removeConflictRecord(pc.store, file);
		await removeConflictRecord(phone.store, file);
		expect(await pc.git.sync()).toMatchObject({ status: "shared", conflicts: [] });
		expect(await phone.git.sync()).toMatchObject({ status: "shared", conflicts: [] });
		expect(existsSync(join(pc.root, ".pkm-git"))).toBe(false);
		expect(existsSync(join(phone.root, ".pkm-git"))).toBe(false);
		expect(await pc.read("a.md")).toBe("edited\n");
	});

	it("読めない記録があっても同期は止まらず、一覧には理由つきで出る", async () => {
		mkdirSync(join(pc.root, CONFLICT_RECORD_DIR), { recursive: true });
		writeFileSync(join(pc.root, CONFLICT_RECORD_DIR, "20990101T000000Z-00000000.json"), '{"schemaVersion":99}');
		expect((await pc.git.sync()).status).toBe("shared");
		expect(await listConflictRecords(pc.store)).toMatchObject([{ error: expect.stringContaining("schemaVersion") }]);
	});

	it("criss-cross の履歴で、どちらかの祖先を選んで黙って戻さず、衝突として両方を残す", async () => {
		const o = cli(pc, "rev-parse", "HEAD");
		const commitF = (parent: string[], text: string, msg: string): string => {
			writeFileSync(join(pc.root, "f.md"), text);
			cli(pc, "add", "f.md");
			const tree = cli(pc, "write-tree");
			return cli(pc, "commit-tree", tree, ...parent.flatMap((p) => ["-p", p]), "-m", msg);
		};
		const a = commitF([o], "v1\n", "A");
		const b = commitF([o], "v2\n", "B");
		// ローカルは B の内容でマージ、リモートは A の内容でマージ（共通祖先は A と B の 2 つ）
		const ours = commitF([a, b], "v2\n", "ours");
		const theirs = commitF([b, a], "v1\n", "theirs");
		cli(pc, "reset", "-q", "--hard", ours);
		execFileSync("git", ["-C", pc.root, "push", "-q", "--force", join(server.root, "remote.git"), `${theirs}:refs/heads/main`]);

		const res = await pc.git.sync();
		expect(res.status).toBe("shared");
		expect(res.mergeBases).toEqual([2]);
		expect(res.conflicts).toMatchObject([{ path: "f.md", kind: "markers" }]);
		const text = await pc.read("f.md");
		expect(text).toContain("v1");
		expect(text).toContain("v2");
	});
});

describe("中断からの復旧の残り（ADR-0103 の 5）", () => {
	let server: GitServer;
	let pc: Device;
	let phone: Device;

	beforeEach(async () => {
		server = new GitServer();
		server.init({ "a.md": "a\n", "b.md": "b\n" });
		await server.start();
		pc = createDevice("pc");
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

	it("snapshot のコミットの前に落ちても、次の snapshot が 1 つのコミットにまとめる", async () => {
		const before = cli(pc, "rev-list", "--count", "HEAD");
		await pc.write("x.md", "x\n");
		await pc.write("y.md", "y\n");
		vi.spyOn(git, "commit").mockRejectedValueOnce(new Error("crash"));
		await expect(pc.git.sync()).rejects.toThrow("crash");
		vi.restoreAllMocks();
		expect(await pc.git.sync()).toMatchObject({ status: "shared", snapshot: true });
		expect(Number(cli(pc, "rev-list", "--count", "HEAD"))).toBe(Number(before) + 1);
		expect(server.remoteFile("x.md")).toBe("x\n");
		expect(server.remoteFile("y.md")).toBe("y\n");
	});

	it("マージのコミットを作った後、作業ファイルを書く前に落ちても、次の同期がマージをやり直す", async () => {
		await phone.write("b.md", "phone\n");
		await phone.git.sync();
		await pc.write("a.md", "pc\n");
		const spy = vi.spyOn(pc.git as unknown as { moveTo: () => Promise<string[]> }, "moveTo").mockRejectedValueOnce(new Error("crash"));
		await expect(pc.git.sync()).rejects.toThrow("crash");
		spy.mockRestore();
		const head = cli(pc, "rev-parse", "HEAD");
		expect(cli(pc, "log", "-1", "--format=%P", head).split(" ")).toHaveLength(1);
		expect(await pc.read("b.md")).toBe("b\n");

		expect(await pc.git.sync()).toMatchObject({ status: "shared", conflicts: [] });
		expect(await pc.read("b.md")).toBe("phone\n");
		expect(server.remoteFile("a.md")).toBe("pc\n");
	});

	it("push の応答を受け取る前に落ちても、次の同期は送った版を最新として扱う", async () => {
		await pc.write("x.md", "x\n");
		const tracking = cli(pc, "rev-parse", "refs/remotes/origin/main");
		const push = git.push.bind(git);
		vi.spyOn(git, "push").mockImplementationOnce(async (args) => {
			await push(args);
			throw new Error("lost response");
		});
		await expect(pc.git.sync()).rejects.toThrow("lost response");
		vi.restoreAllMocks();
		// 応答がなかったので、追跡ブランチは更新されていないものとする
		cli(pc, "update-ref", "refs/remotes/origin/main", tracking);
		expect(server.remoteFile("x.md")).toBe("x\n");

		expect(await pc.git.sync()).toMatchObject({ status: "shared", snapshot: false, attempts: 0 });
		expect(await pc.git.shareState()).toEqual({ unpushed: false, changed: [] });
	});
});
