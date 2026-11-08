import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WorktreeChangedError } from "../src/git/engine";
import * as tree from "../src/git/tree";
import { createDevice, type Device } from "./helpers/device";
import { GitServer } from "./helpers/git-server";

describe("同期の計測とツリー再利用", () => {
	let server: GitServer;
	let pc: Device;
	let phone: Device;
	let events: Array<[string, number]>;
	let onTiming: (phase: string, ms: number) => void;

	beforeEach(async () => {
		events = [];
		onTiming = (phase, ms) => { events.push([phase, ms]); };
		server = new GitServer();
		server.init({ "note.md": "first\nmiddle\nlast\n" });
		await server.start();
		pc = createDevice("pc", undefined, undefined, (phase, ms) => onTiming(phase, ms));
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

	it("push と pull の工程名と有限の経過時間を通知する", async () => {
		await pc.write("local.md", "local\n");
		expect((await pc.git.push()).kind).toBe("pushed");
		expect(events.map(([phase]) => phase)).toEqual(["fetch", "snapshot", "push"]);
		await phone.git.pull();
		await phone.write("remote.md", "remote\n");
		await phone.git.push();
		events.length = 0;
		expect((await pc.git.pull()).kind).toBe("fast-forward");
		expect(events.map(([phase]) => phase)).toEqual(["snapshot", "fetch", "merge-base", "moveTo"]);
		expect(events.every(([, ms]) => Number.isFinite(ms) && ms >= 0)).toBe(true);
	});

	it("計測コールバックの例外は成功した同期を失敗させない", async () => {
		onTiming = () => { throw new Error("diagnostic failed"); };
		await pc.write("local.md", "local\n");
		expect((await pc.git.push()).kind).toBe("pushed");
		expect(server.remoteFile("local.md")).toBe("local\n");
		await phone.write("remote.md", "remote\n");
		await phone.git.pull();
		await phone.git.push();
		expect((await pc.git.pull()).kind).toBe("fast-forward");
		expect(await pc.read("remote.md")).toBe("remote\n");
	});

	it("失敗した工程も計測し、元のエラーを保つ", async () => {
		const failure = new Error("fetch failed");
		vi.spyOn(pc.git, "fetch").mockRejectedValue(failure);
		onTiming = (phase, ms) => { events.push([phase, ms]); throw new Error("diagnostic failed"); };
		await expect(pc.git.pull()).rejects.toBe(failure);
		expect(events.map(([phase]) => phase)).toEqual(["snapshot", "fetch"]);
	});

	it("マージは local ツリーを再展開せず、各工程を計測する", async () => {
		await phone.write("note.md", "first remote\nmiddle\nlast\n");
		await phone.git.push();
		await pc.write("note.md", "first\nmiddle\nlast local\n");
		const reads = vi.spyOn(tree, "readTreeMap");
		onTiming = (phase, ms) => {
			events.push([phase, ms]);
			if (phase === "snapshot") reads.mockClear();
		};
		expect((await pc.git.pull()).kind).toBe("merged");
		expect(await pc.read("note.md")).toBe("first remote\nmiddle\nlast local\n");
		// base / local / remote / merged の4つ。local を moveTo で再読しない。
		expect(reads).toHaveBeenCalledTimes(4);
		expect(new Set(reads.mock.calls.map(([, oid]) => oid)).size).toBe(4);
		expect(events.map(([phase]) => phase)).toEqual([
			"snapshot", "fetch", "merge-base", "read-trees", "merge", "write-tree", "moveTo",
		]);
	});

	it("再利用する local ツリーがあっても snapshot 後の編集を上書きしない", async () => {
		await phone.write("note.md", "first remote\nmiddle\nlast\n");
		await phone.git.push();
		await pc.write("note.md", "first\nmiddle\nlast local\n");
		await pc.git.snapshot();
		const before = await pc.read(".git/refs/heads/main");
		const fetch = pc.git.fetch.bind(pc.git);
		vi.spyOn(pc.git, "fetch").mockImplementation(async (branch) => {
			const result = await fetch(branch);
			await pc.write("note.md", "editing while fetching\n");
			return result;
		});
		await expect(pc.git.pull()).rejects.toBeInstanceOf(WorktreeChangedError);
		expect(await pc.read("note.md")).toBe("editing while fetching\n");
		expect(await pc.read(".git/refs/heads/main")).toBe(before);
	});
});
