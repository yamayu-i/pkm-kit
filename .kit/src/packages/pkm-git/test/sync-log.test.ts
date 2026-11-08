import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SYNC_LOG, SYNC_LOG_OLD, SyncLog } from "../src/git/sync-log";
import { NodeFileStore } from "./helpers/node-store";

const SECRET = "ghp_secret_token_value";

describe("同期の記録（ADR-0089 の 8）", () => {
	let root: string;
	let store: NodeFileStore;
	let log: SyncLog;

	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "pkm-git-log-"));
		store = new NodeFileStore(root);
		log = new SyncLog({
			store,
			pluginVersion: "0.0.0-test",
			platform: "desktop",
			secrets: () => [SECRET],
			now: () => new Date(2026, 10, 8, 12, 0, 0),
		});
	});

	afterEach(() => rmSync(root, { recursive: true, force: true }));

	it("1 行 1 件で残し、新しい順に読める", async () => {
		await log.write({ level: "warn", event: "push-rejected", trigger: "interval", phase: "push", state: { attempt: 3 } });
		await log.write({ level: "error", event: "unexpected-error", trigger: "manual", phase: "merge", error: new TypeError("boom"), paths: ["a.md"] });
		const text = new TextDecoder().decode(await store.read(SYNC_LOG));
		expect(text.trim().split("\n")).toHaveLength(2);
		const entries = await log.read();
		expect(entries.map((e) => e.event)).toEqual(["unexpected-error", "push-rejected"]);
		expect(entries[0]).toMatchObject({
			schemaVersion: 1, level: "error", trigger: "manual", phase: "merge", kind: "TypeError", message: "boom",
			paths: ["a.md"], pluginVersion: "0.0.0-test", platform: "desktop",
		});
		expect(entries[0]?.time).toMatch(/^2026-11-08T12:00:00([+-]\d\d:\d\d|Z)$/);
		expect(entries[1]?.state).toEqual({ attempt: 3 });
	});

	it("トークンと URL の認証情報を残さない", async () => {
		const error = new Error(`failed https://user:${SECRET}@github.com/o/r.git token=${SECRET}`); // security-scan: allow（テスト用のダミー値）
		await log.write({ level: "error", event: "unexpected-error", error, detail: `with ${SECRET}` });
		const text = new TextDecoder().decode(await store.read(SYNC_LOG));
		expect(text).not.toContain(SECRET);
		expect(text).not.toContain("user:");
		expect(text).toContain("***");
	});

	it("isomorphic-git の code を残す", async () => {
		const error = Object.assign(new Error("rejected"), { code: "PushRejectedError" });
		await log.write({ level: "warn", event: "x", error });
		expect((await log.read())[0]?.code).toBe("PushRejectedError");
	});

	it("大きさの上限を超えたら log.1.jsonl に移す。2 つを超えて増えない", async () => {
		const small = new SyncLog({ store, pluginVersion: "t", platform: "desktop", secrets: () => [], maxBytes: 1024 });
		for (let i = 0; i < 40; i++) await small.write({ level: "warn", event: `e${i}`, detail: "x".repeat(100) });
		const cur = await store.stat(SYNC_LOG);
		const old = await store.stat(SYNC_LOG_OLD);
		expect(cur && cur.size <= 1024).toBe(true);
		expect(old && old.size <= 1024).toBe(true);
		const entries = await small.read();
		expect(entries[0]?.event).toBe("e39");
		expect(entries.length).toBeLessThan(40);
	});

	it("書き込みに失敗しても例外を外に出さない", async () => {
		const broken = new SyncLog({
			store: { ...store, stat: store.stat.bind(store), read: store.read.bind(store), write: async () => { throw new Error("disk full"); } } as unknown as NodeFileStore,
			pluginVersion: "t", platform: "desktop", secrets: () => [],
		});
		await expect(broken.write({ level: "error", event: "x" })).resolves.toBeUndefined();
	});

	it("壊れた行は飛ばして読む", async () => {
		await log.write({ level: "warn", event: "ok" });
		const text = new TextDecoder().decode(await store.read(SYNC_LOG));
		await store.write(SYNC_LOG, new TextEncoder().encode(`${text}{broken\n`));
		expect((await log.read()).map((e) => e.event)).toEqual(["ok"]);
	});
});
