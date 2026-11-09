import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDevice, type Device } from "./helpers/device";
import { GitServer } from "./helpers/git-server";

/**
 * clone が最新の版だけを取る端末（shallow）でも、今と同じく同期できること（ADR-0106）。
 * 本物の git http-backend を相手にする
 */
function seedCommit(server: GitServer, files: Record<string, string>, message: string): void {
	const seed = join(server.root, "seed");
	for (const [path, text] of Object.entries(files)) writeFileSync(join(seed, path), text);
	execFileSync("git", ["-C", seed, "add", "."]);
	execFileSync("git", ["-C", seed, "-c", "user.name=s", "-c", "user.email=s@s", "commit", "-qm", message]);
	execFileSync("git", ["-C", seed, "push", "-q", "--force", join(server.root, "remote.git"), "HEAD:refs/heads/main"]);
}

function commitCount(device: Device): number {
	return Number(execFileSync("git", ["-C", device.root, "rev-list", "--count", "HEAD"], { encoding: "utf8" }).trim());
}

describe("shallow の端末の同期（ADR-0106）", () => {
	let server: GitServer;
	const devices: Device[] = [];
	const device = (name: string): Device => {
		const d = createDevice(name);
		devices.push(d);
		return d;
	};

	beforeEach(async () => {
		server = new GitServer();
		server.init({ "note.md": "n\n" });
		for (let i = 1; i <= 3; i++) seedCommit(server, { [`f${i}.md`]: `${i}\n` }, `v${i}`);
		await server.start();
	});

	afterEach(async () => {
		for (const d of devices.splice(0)) d.cleanup();
		await server.stop();
	});

	it("clone は最新の版だけを持ち、送る・受け取る・マージするが今と同じく動く", async () => {
		const other = device("other");
		await other.git.clone(server.url, "main");
		const sh = device("sh");
		await sh.git.clone(server.url, "main");
		expect(commitCount(sh)).toBe(1);
		expect(existsSync(join(sh.root, ".git/shallow"))).toBe(true);

		await sh.write("x.md", "x\n");
		expect((await sh.git.sync()).status).toBe("shared");
		expect(server.remoteFile("x.md")).toBe("x\n");

		await other.git.sync();
		await other.write("y.md", "y\n");
		await other.git.sync();
		expect(await sh.git.sync()).toMatchObject({ status: "shared", changed: ["y.md"] });

		await other.write("note.md", "other\n");
		await other.git.sync();
		await sh.write("z.md", "z\n");
		expect(await sh.git.sync()).toMatchObject({ status: "shared", changed: ["note.md"], mergeBases: [1] });
		expect(server.remoteFile("z.md")).toBe("z\n");
		expect(server.remoteFile("note.md")).toBe("other\n");
	});

	it("長くオフラインだった端末が、clone より前の版を土台にしたコミットを送っても受け取れる", async () => {
		const phone = device("phone");
		await phone.git.clone(server.url, "main");
		const pc = device("pc");
		await pc.git.clone(server.url, "main");
		phone.setOffline(true);
		await phone.write("note.md", "phone\n");
		await phone.git.snapshot();
		for (let i = 0; i < 3; i++) {
			await pc.write(`pc${i}.md`, `${i}\n`);
			await pc.git.sync();
		}
		const sh = device("sh");
		await sh.git.clone(server.url, "main");
		// shallow の端末にも送っていないコミットがある
		sh.setOffline(true);
		await sh.write("s.md", "s\n");
		await sh.git.snapshot();

		phone.setOffline(false);
		expect((await phone.git.sync()).status).toBe("shared");
		sh.setOffline(false);
		const res = await sh.git.sync();
		expect(res).toMatchObject({ status: "shared", conflicts: [], mergeBases: [1] });
		expect(await sh.read("note.md")).toBe("phone\n");
		expect(server.remoteFile("s.md")).toBe("s\n");
	});

	it("リモートの履歴が書き換えられ、共通祖先が手元にないときも、エラーにせず両側を残す", async () => {
		const sh = device("sh");
		await sh.git.clone(server.url, "main");
		await sh.write("note.md", "sh\n");
		await sh.git.snapshot();
		const seed = join(server.root, "seed");
		execFileSync("git", ["-C", seed, "reset", "-q", "--hard", "HEAD~2"]);
		seedCommit(server, { "note.md": "rewritten\n" }, "rewrite");

		const res = await sh.git.sync();
		expect(res).toMatchObject({ status: "shared", mergeBases: [0], conflicts: [{ path: "note.md", kind: "markers" }] });
		const note = await sh.read("note.md");
		expect(note).toContain("sh");
		expect(note).toContain("rewritten");
		// リモートで消えたファイルも、手元の版として残る
		expect(await sh.exists("f3.md")).toBe(true);
	});
});
