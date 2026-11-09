import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDevice, type Device } from "./helpers/device";
import { GitServer, TEST_TOKEN } from "./helpers/git-server";
import { createObsidianMock } from "./helpers/obsidian-mock";

const bundlePath = fileURLToPath(new URL("../../../../../.obsidian/plugins/pkm-git/main.js", import.meta.url));

interface PluginInstance {
	data: unknown;
	commands: Record<string, () => void>;
	onload(): Promise<void>;
	pull(): Promise<void>;
	push(): Promise<void>;
	sync(): Promise<void>;
}

/**
 * ビルド済み main.js を、モバイルと同じく Buffer がない状態で読み込む。
 * グローバルを消すと Node の fetch が壊れるので、引数で `Buffer` を undefined にして隠す。
 */
function loadBundle(obsidian: unknown): new () => PluginInstance {
	const src = readFileSync(bundlePath, "utf8");
	const module = { exports: {} as { default: new () => PluginInstance } };
	const req = (name: string) => {
		if (name === "obsidian") return obsidian;
		throw new Error(`unexpected require: ${name}`);
	};
	new Function("module", "exports", "require", "Buffer", src)(module, module.exports, req, undefined);
	return module.exports.default;
}

interface Internals {
	openResolve(path: string): Promise<void>;
	useCopy(copy: string, original: string): Promise<void>;
	discardCopy(copy: string): Promise<void>;
	showHistory(path: string): Promise<void>;
}

/** 最後に開いたモーダル（mark の後に作ったボタン）で、同じ名前のボタンのうち index 番目を押す（塊・行の順） */
let mark = 0;
async function pick(mock: ReturnType<typeof createObsidianMock>, label: string, index: number): Promise<void> {
	const b = mock.buttons.slice(mark).filter((x) => x.label === label).at(index);
	if (!b?.handler) throw new Error(`no button: ${label} #${index}`);
	await b.handler();
}

async function until(done: () => boolean): Promise<void> {
	for (let i = 0; i < 200; i++) {
		try {
			if (done()) return;
		} catch { /* まだない */ }
		await new Promise((r) => setTimeout(r, 25));
	}
	throw new Error("timed out");
}

describe.skipIf(!existsSync(bundlePath))("ビルド済み main.js（Obsidian API モック上）", () => {
	let server: GitServer;
	let pc: Device;
	let phoneRoot: string;

	beforeEach(async () => {
		server = new GitServer();
		server.init({ "note.md": "a\nb\nc\n" });
		await server.start();
		pc = createDevice("pc");
		await pc.git.clone(server.url, "main");
		const phone = createDevice("phone-setup");
		await phone.git.clone(server.url, "main");
		phoneRoot = mkdtempSync(join(tmpdir(), "pkm-git-mobile-"));
		rmSync(phoneRoot, { recursive: true });
		await import("node:fs/promises").then((f) => f.rename(phone.store.root, phoneRoot));
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		pc.cleanup();
		rmSync(phoneRoot, { recursive: true, force: true });
		await server.stop();
	});

	it("pull でコンフリクトをマーカー入りで残し、push できる。リモートが先に進んでいても取り込んでから送る（ADR-0089）", async () => {
		const mock = createObsidianMock(phoneRoot, { gh: TEST_TOKEN });
		const Plugin = loadBundle(mock.obsidian);
		const plugin = new Plugin();
		// 起動時の自動の同期と競わないよう、このテストでは自動の同期を止める
		plugin.data = { tokenSecretId: "gh", deviceName: "iphone", authHost: "127.0.0.1", autoSyncMinutes: 0 };

		await plugin.onload();

		await pc.write("note.md", "a\nPC\nc\n");
		expect((await pc.git.push()).kind).toBe("pushed");
		await mock.vault.modifyBinary(
			mock.vault.getFileByPath("note.md") as never,
			new TextEncoder().encode("a\nPHONE\nc\n").buffer,
		);

		await plugin.pull();
		expect(mock.notices.at(-1)).toContain("コンフリクト 1 件");
		expect(mock.modals).toContain("コンフリクトがありました");
		expect(readFileSync(join(phoneRoot, "note.md"), "utf8")).toBe(
			"a\n<<<<<<< local (iphone)\nPHONE\n=======\nPC\n>>>>>>> remote (origin/main)\nc\n",
		);
		// ノートは Vault API、.git は adapter で書かれている
		expect(mock.vaultWrites).toContain("note.md");
		expect(mock.adapterWrites.every((p) => p.startsWith(".git/"))).toBe(true);

		await plugin.push();
		expect(mock.notices.at(-1)).toBe("Git: 同期しました");
		expect(server.remoteFile("note.md")).toContain("<<<<<<< local (iphone)");

		await pc.git.pull();
		await pc.write("other.md", "x\n");
		await pc.git.push();
		await mock.vault.createBinary("mine.md", new TextEncoder().encode("m\n").buffer);
		await plugin.push();
		expect(mock.notices.at(-1)).toBe("Git: 同期しました（取り込み 1 件）");
		expect(server.remoteFile("mine.md")).toBe("m\n");
		expect(readFileSync(join(phoneRoot, "other.md"), "utf8")).toBe("x\n");
	});

	it("起動すると自動で同期し、共有の状態をステータスバーに出す。編集すると共有待ちになる（ADR-0089）", async () => {
		const mock = createObsidianMock(phoneRoot, { gh: TEST_TOKEN });
		const plugin = new (loadBundle(mock.obsidian))();
		plugin.data = { tokenSecretId: "gh", deviceName: "iphone", authHost: "127.0.0.1" };
		await pc.write("from-pc.md", "pc\n");
		await pc.git.push();
		await plugin.onload();
		// 起動時の同期を待つ（同じキューに並べた手の同期が終われば、起動時のものも終わっている）
		await plugin.sync();
		expect(readFileSync(join(phoneRoot, "from-pc.md"), "utf8")).toBe("pc\n");
		expect(mock.statusTexts.at(-1)).toBe("Git: Synced");
		await mock.vault.createBinary("draft.md", new TextEncoder().encode("d\n").buffer);
		mock.emit("create", "draft.md");
		expect(mock.statusTexts.at(-1)).toBe("Git: Not synced");
		await plugin.sync();
		expect(mock.statusTexts.at(-1)).toBe("Git: Synced");
		expect(server.remoteFile("draft.md")).toBe("d\n");
	});

	it("衝突の記録を未解決の件数に入れ、ファイルのない記録は自動で消す（ADR-0103 の 3）", async () => {
		const dir = join(phoneRoot, ".pkm-git/conflicts");
		mkdirSync(dir, { recursive: true });
		const oid = "a".repeat(40);
		const record = (path: string) => JSON.stringify({
			schemaVersion: 1, kind: "kept-modified", path, deleted: "remote", device: "pc",
			at: "2026-10-31T12:00:00+09:00", local: oid, remote: oid, bases: [oid],
		});
		writeFileSync(join(dir, "20261031T030000Z-00000001.json"), record("note.md"));
		writeFileSync(join(dir, "20261031T030000Z-00000002.json"), record("gone.md"));
		writeFileSync(join(dir, "20261031T030000Z-00000003.json"), '{"schemaVersion":99}');
		const mock = createObsidianMock(phoneRoot, { gh: TEST_TOKEN });
		const plugin = new (loadBundle(mock.obsidian))();
		plugin.data = { tokenSecretId: "gh", authHost: "127.0.0.1", autoSyncMinutes: 0 };
		await plugin.onload();
		await plugin.sync();
		// note.md の記録と、読めない記録の 2 件。gone.md の記録は消えて、同期でリモートからも消える
		expect(mock.statusTexts.at(-1)).toMatch(/ · ⚠ 2$/);
		expect(existsSync(join(dir, "20261031T030000Z-00000002.json"))).toBe(false);
		expect(existsSync(join(dir, "20261031T030000Z-00000001.json"))).toBe(true);
		const log = readFileSync(join(phoneRoot, ".git/pkm-git/log.jsonl"), "utf8");
		expect(log).toContain('"event":"conflict-record-unreadable"');
	});

	it("マーカーを塊ごとに選んで解き、開いた後に本文が変わっていたら書かない（ADR-0110 の 1）", async () => {
		const marked = "head\n<<<<<<< local (iphone)\na-local\n=======\na-remote\n>>>>>>> remote (origin/main)\nmid\n"
			+ "<<<<<<< local (iphone)\nb-local\n=======\nb-remote\n>>>>>>> remote (origin/main)\n";
		writeFileSync(join(phoneRoot, "c.md"), marked);
		writeFileSync(join(phoneRoot, "d.md"), marked);
		const mock = createObsidianMock(phoneRoot, { gh: TEST_TOKEN });
		const plugin = new (loadBundle(mock.obsidian))() as unknown as PluginInstance & Internals;
		plugin.data = { tokenSecretId: "gh", authHost: "127.0.0.1", autoSyncMinutes: 0 };
		await plugin.onload();

		mark = mock.buttons.length;
		await plugin.openResolve("c.md");
		expect(mock.modals.at(-1)).toBe("Resolve conflicts");
		// すべて選ぶまで Apply は押せない
		await expect(mock.click("Apply")).rejects.toThrow();
		await pick(mock, "Use local", 0);
		await pick(mock, "Use both", 1);
		await mock.click("Apply");
		await until(() => server.remoteFile("c.md") === "head\na-local\nmid\nb-local\nb-remote\n");
		expect(readFileSync(join(phoneRoot, "c.md"), "utf8")).toBe("head\na-local\nmid\nb-local\nb-remote\n");

		mark = mock.buttons.length;
		await plugin.openResolve("d.md");
		await pick(mock, "Use remote", 0);
		await pick(mock, "Use remote", 1);
		writeFileSync(join(phoneRoot, "d.md"), `${marked}edited\n`);
		await mock.click("Apply");
		await until(() => mock.notices.some((n) => n.includes("本文が変わった")));
		expect(readFileSync(join(phoneRoot, "d.md"), "utf8")).toBe(`${marked}edited\n`);
	});

	it("別名の版を Use this version と Discard で解く（ADR-0110 の 2）", async () => {
		const copy = (name: string) => `${name} (conflict pc 2026-10-31 1200).md`;
		writeFileSync(join(phoneRoot, "a.md"), "original\n");
		writeFileSync(join(phoneRoot, copy("a")), "from copy\n");
		writeFileSync(join(phoneRoot, copy("b")), "only copy\n");
		writeFileSync(join(phoneRoot, copy("c")), "discard me\n");
		const mock = createObsidianMock(phoneRoot, { gh: TEST_TOKEN });
		const plugin = new (loadBundle(mock.obsidian))() as unknown as PluginInstance & Internals;
		plugin.data = { tokenSecretId: "gh", authHost: "127.0.0.1", autoSyncMinutes: 0 };
		await plugin.onload();

		await plugin.useCopy(copy("a"), "a.md");
		expect(readFileSync(join(phoneRoot, "a.md"), "utf8")).toBe("from copy\n");
		expect(existsSync(join(phoneRoot, copy("a")))).toBe(false);
		// 元のファイルがなければ、別名の版を元の名前に改名する
		await plugin.useCopy(copy("b"), "b.md");
		expect(readFileSync(join(phoneRoot, "b.md"), "utf8")).toBe("only copy\n");
		expect(existsSync(join(phoneRoot, copy("b")))).toBe(false);
		await plugin.discardCopy(copy("c"));
		expect(existsSync(join(phoneRoot, copy("c")))).toBe(false);
		expect(server.remoteFile("a.md")).toBe("from copy\n");
		expect(server.remoteFile("b.md")).toBe("only copy\n");
	});

	it("前の版に戻す前に今の内容をコミットし、戻した内容を送る（ADR-0110 の 3）", async () => {
		const mock = createObsidianMock(phoneRoot, { gh: TEST_TOKEN });
		const plugin = new (loadBundle(mock.obsidian))() as unknown as PluginInstance & Internals;
		plugin.data = { tokenSecretId: "gh", deviceName: "iphone", authHost: "127.0.0.1", autoSyncMinutes: 0 };
		await plugin.onload();
		for (const text of ["v1\n", "v2\n"]) {
			writeFileSync(join(phoneRoot, "note.md"), text);
			await plugin.sync();
		}
		writeFileSync(join(phoneRoot, "note.md"), "not synced\n");

		mark = mock.buttons.length;
		await plugin.showHistory("note.md");
		expect(mock.modals.at(-1)).toBe("File history");
		// 新しい順: v2、v1、clone の版
		await pick(mock, "Restore", 1);
		expect(mock.modals.at(-1)).toBe("Restore");
		await mock.click("Run");
		await until(() => server.remoteFile("note.md") === "v1\n");
		expect(readFileSync(join(phoneRoot, "note.md"), "utf8")).toBe("v1\n");
		const log = execFileSync("git", ["-C", phoneRoot, "log", "--format=%s", "-3"], { encoding: "utf8" });
		expect(log).toContain("vault: keep before restore note.md (iphone)");
		const kept = execFileSync("git", ["-C", phoneRoot, "show", "HEAD~1:note.md"], { encoding: "utf8" });
		expect(kept).toBe("not synced\n");
	});

	it("同期できないときは記録に残し、トークンを書かない（ADR-0089 の 8）", async () => {
		const mock = createObsidianMock(phoneRoot, { gh: TEST_TOKEN });
		const plugin = new (loadBundle(mock.obsidian))();
		plugin.data = { tokenSecretId: "gh", authHost: "127.0.0.1", autoSyncMinutes: 0 };
		await plugin.onload();
		// 知らない形の取り込みの記録
		mkdirSync(join(phoneRoot, ".git/pkm-git"), { recursive: true });
		writeFileSync(join(phoneRoot, ".git/pkm-git/apply.json"), '{"schemaVersion":99}');
		await plugin.sync();
		expect(mock.notices.at(-1)).toContain("同期できませんでした");
		expect(mock.statusTexts.at(-1)).toBe("Git: Sync failed");
		const log = readFileSync(join(phoneRoot, ".git/pkm-git/log.jsonl"), "utf8");
		expect(JSON.parse(log.trim().split("\n").at(-1) as string)).toMatchObject({
			level: "error", event: "apply-journal-unreadable", trigger: "manual", pluginVersion: "0.0.0-test",
		});
		expect(log).not.toContain(TEST_TOKEN);
		plugin.commands["show-sync-log"]?.();
		await new Promise((r) => setTimeout(r, 50));
		expect(mock.modals.at(-1)).toBe("Sync log");
	});

	it("設定にないホストにはトークンを送らない（既定は github.com）", async () => {
		const before = server.authorizedRequests;
		const mock = createObsidianMock(phoneRoot, { gh: TEST_TOKEN });
		const plugin = new (loadBundle(mock.obsidian))();
		plugin.data = { tokenSecretId: "gh" };
		await plugin.onload();
		await plugin.pull();
		expect(mock.notices.at(-1)).toContain("設定にないホストには認証情報を送りません");
		expect(server.authorizedRequests).toBe(before);
	});

	it("グローバルの Buffer を参照していない", () => {
		expect(readFileSync(bundlePath, "utf8")).not.toMatch(/(globalThis|global|window|self)\.Buffer\b/);
	});

	it("状態更新を計測し、ログ出力に失敗しても同期を完了する", async () => {
		const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
		const mock = createObsidianMock(phoneRoot, { gh: TEST_TOKEN });
		const plugin = new (loadBundle(mock.obsidian))();
		plugin.data = { tokenSecretId: "gh", authHost: "127.0.0.1" };
		await plugin.onload();
		await plugin.pull();
		expect(debug.mock.calls.some(([message]) => /^\[pkm-git\] refreshStatus: \d+\.\d ms$/.test(message))).toBe(true);
		debug.mockImplementation(() => { throw new Error("console unavailable"); });
		await pc.write("new.md", "remote\n");
		await pc.git.push();
		await expect(plugin.pull()).resolves.toBeUndefined();
		expect(readFileSync(join(phoneRoot, "new.md"), "utf8")).toBe("remote\n");
	});

	it("トークンがエラーメッセージに出ない", async () => {
		const mock = createObsidianMock(phoneRoot, { gh: "wrong-token-secret" });
		const plugin = new (loadBundle(mock.obsidian))();
		plugin.data = { tokenSecretId: "gh", authHost: "127.0.0.1" };
		await plugin.onload();
		await plugin.pull();
		const last = mock.notices.at(-1) ?? "";
		expect(last).toContain("認証に失敗しました");
		expect(last).not.toContain("wrong-token-secret");
	});
});
