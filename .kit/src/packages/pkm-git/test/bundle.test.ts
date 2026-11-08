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
