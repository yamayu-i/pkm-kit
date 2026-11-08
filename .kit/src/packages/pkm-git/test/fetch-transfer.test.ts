import { randomBytes } from "node:crypto";
import git from "isomorphic-git";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createGitFs, GIT_DIR_ROOT } from "../src/fs/git-fs";
import type { Transfer } from "../src/git/engine";
import { createDevice, type Device } from "./helpers/device";
import { GitServer } from "./helpers/git-server";

/**
 * fetch が、すでに持っている履歴を取り直さないことを、実際の isomorphic-git と
 * git http-backend の組み合わせで確かめる（受入テスト F1〜F3）。
 * 圧縮の効かないアセットを何版も持つ履歴を作り、upload-pack の応答の大きさで判定する。
 */
const ASSET_SIZE = 64 * 1024;
const VERSIONS = 16;
/** 全履歴（約 1 MiB）を取り直したら必ず超える。差分だけなら十分に下回る */
const SMALL = 64 * 1024;

function growHistory(server: GitServer, branch = "main"): void {
	for (let i = 0; i < VERSIONS; i++) {
		server.commitFromSeed({ "asset/photo.bin": randomBytes(ASSET_SIZE) }, `asset v${i}`, branch);
	}
}

async function listRefs(device: Device, filepath: string): Promise<string[]> {
	const fs = createGitFs(device.store);
	return git.listRefs({ fs, dir: GIT_DIR_ROOT, filepath });
}

describe("fetch の転送量（全履歴を取り直さない）", () => {
	let server: GitServer;
	let pc: Device;
	let phone: Device;

	beforeEach(async () => {
		server = new GitServer();
		server.init({ "note.md": "line1\nline2\nline3\n" });
		growHistory(server);
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

	it("clone では全履歴を取得する（比較の基準）", async () => {
		// beforeEach の 2 台分。1 台あたり全版のアセットを含む
		expect(server.uploadPackBytes).toBeGreaterThan(2 * VERSIONS * ASSET_SIZE * 0.9);
	});

	it("F1: 未公開のローカルコミットがあり、リモートが変わっていないとき、pack を取り直さない", async () => {
		await pc.write("local.md", "local\n");
		expect(await pc.git.snapshot()).toBe(true);
		server.uploadPackBytes = 0;
		expect((await pc.git.pull()).kind).toBe("ahead");
		expect(server.uploadPackBytes).toBeLessThan(SMALL);
	});

	it("F1: 未公開のローカルコミットがあるときの push の前の fetch も、pack を取り直さない", async () => {
		await pc.write("local.md", "local\n");
		expect(await pc.git.snapshot()).toBe(true);
		server.uploadPackBytes = 0;
		expect((await pc.git.push()).kind).toBe("pushed");
		expect(server.uploadPackBytes).toBeLessThan(SMALL);
		expect(server.remoteFile("local.md")).toBe("local\n");
	});

	it("F2: 双方に変更があるとき、リモートの差分だけを取得し、両方の変更を残す", async () => {
		await phone.write("from-phone.md", "phone\n");
		expect((await phone.git.push()).kind).toBe("pushed");
		await pc.write("local.md", "local\n");
		expect(await pc.git.snapshot()).toBe(true);
		server.uploadPackBytes = 0;
		const res = await pc.git.pull();
		expect(res.kind).toBe("merged");
		expect(server.uploadPackBytes).toBeLessThan(SMALL);
		expect(await pc.read("from-phone.md")).toBe("phone\n");
		expect(await pc.read("local.md")).toBe("local\n");
	});

	it("F2: 何度も同期を繰り返しても、1 回の転送量が履歴の長さに比例して増えない", async () => {
		for (let round = 0; round < 3; round++) {
			await phone.write(`p${round}.md`, `phone ${round}\n`);
			expect((await phone.git.push()).kind).toBe("pushed");
			await pc.write(`c${round}.md`, `pc ${round}\n`);
			expect(await pc.git.snapshot()).toBe(true);
			server.uploadPackBytes = 0;
			expect((await pc.git.pull()).kind).toBe("merged");
			expect((await pc.git.push()).kind).toBe("pushed");
			expect(server.uploadPackBytes).toBeLessThan(SMALL);
			server.uploadPackBytes = 0;
			expect((await phone.git.pull()).kind).toBe("fast-forward");
			expect(server.uploadPackBytes).toBeLessThan(SMALL);
		}
	});

	it("リモートの追跡ブランチがなくても、ローカルのブランチを基準に fetch できる", async () => {
		const fs = createGitFs(pc.store);
		await git.deleteRef({ fs, dir: GIT_DIR_ROOT, ref: "refs/remotes/origin/main" });
		await phone.write("from-phone.md", "phone\n");
		expect((await phone.git.push()).kind).toBe("pushed");
		server.uploadPackBytes = 0;
		expect((await pc.git.pull()).kind).toBe("fast-forward");
		expect(server.uploadPackBytes).toBeLessThan(SMALL);
		expect(await pc.read("from-phone.md")).toBe("phone\n");
	});
});

describe("fetch と clone は対象のブランチだけを取得する（F3）", () => {
	let server: GitServer;
	let pc: Device;

	beforeEach(async () => {
		server = new GitServer();
		server.init({ "note.md": "x\n" });
		for (let i = 0; i < 20; i++) server.tag(`v${i}`);
		server.seedCheckout("other");
		growHistory(server, "other");
		server.seedCheckout("main");
		await server.start();
		pc = createDevice("pc");
	});

	afterEach(async () => {
		pc.cleanup();
		await server.stop();
	});

	it("ほかのブランチの履歴とタグを取得しない", async () => {
		await pc.git.clone(server.url, "main");
		expect(server.uploadPackBytes).toBeLessThan(SMALL);
		expect(await listRefs(pc, "refs/tags")).toEqual([]);
		await pc.write("local.md", "local\n");
		expect(await pc.git.snapshot()).toBe(true);
		server.uploadPackBytes = 0;
		await pc.git.fetch("main");
		expect(server.uploadPackBytes).toBeLessThan(SMALL);
		expect(await listRefs(pc, "refs/tags")).toEqual([]);
		expect(await listRefs(pc, "refs/remotes/origin")).toEqual(["main"]);
	});
});

describe("転送量の通知（onTransfer）", () => {
	let server: GitServer;
	let pc: Device;
	let phone: Device;
	let events: Array<[string, Transfer]>;
	let onTransfer: (phase: string, t: Transfer) => void;

	beforeEach(async () => {
		events = [];
		onTransfer = (phase, t) => { events.push([phase, t]); };
		server = new GitServer();
		server.init({ "note.md": "x\n" });
		growHistory(server);
		await server.start();
		pc = createDevice("pc", undefined, undefined, undefined, (phase, t) => onTransfer(phase, t));
		phone = createDevice("phone");
		await phone.git.clone(server.url, "main");
	});

	afterEach(async () => {
		pc.cleanup();
		phone.cleanup();
		await server.stop();
	});

	it("通信した工程だけを、リクエスト数と送受信のバイト数で通知する", async () => {
		await pc.git.clone(server.url, "main");
		expect(events.map(([phase]) => phase)).toEqual(["clone"]);
		const [, cloned] = events[0] as [string, Transfer];
		expect(cloned.receivedBytes).toBeGreaterThan(VERSIONS * ASSET_SIZE * 0.9);
		expect(cloned.requests).toBeGreaterThanOrEqual(2); // ref の確認と pack の取得（認証の再試行を含むことがある）

		events.length = 0;
		expect((await pc.git.pull()).kind).toBe("up-to-date");
		expect(events.map(([phase]) => phase)).toEqual(["fetch"]);
		const [, noop] = events[0] as [string, Transfer];
		expect(noop.requests).toBeGreaterThanOrEqual(2);
		expect(noop.receivedBytes).toBeLessThan(SMALL);
		expect(noop.sentBytes).toBeGreaterThan(0);

		events.length = 0;
		await pc.write("local.md", "local\n");
		expect((await pc.git.push()).kind).toBe("pushed");
		expect(events.map(([phase]) => phase)).toEqual(["fetch", "push"]);
		const [, pushed] = events[1] as [string, Transfer];
		expect(pushed.sentBytes).toBeGreaterThan(0);
		expect(pushed.sentBytes).toBeLessThan(SMALL);
	});

	it("通知の例外は同期を失敗させない", async () => {
		onTransfer = () => { throw new Error("diagnostic failed"); };
		await pc.git.clone(server.url, "main");
		await pc.write("local.md", "local\n");
		expect((await pc.git.push()).kind).toBe("pushed");
		expect(server.remoteFile("local.md")).toBe("local\n");
	});
});
