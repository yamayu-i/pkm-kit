import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { formatIso } from "../src/stamp/updated";
import { createDevice, type Device } from "./helpers/device";
import { GitServer } from "./helpers/git-server";

// ヘルパーの now は固定(2026-10-31 12:00 ローカル)
const ISO = formatIso(new Date(2026, 9, 31, 12, 0));
const note = (body: string, updated = "updated:", extra = "") => `---\ntype: note\ncreated: "2026-10-01T09:00:00+09:00"\n${updated}\n${extra}---\n${body}`;

describe("コミット時の updated の自動付与(ADR-0028)", () => {
	let server: GitServer;
	let pc: Device;
	let phone: Device;

	beforeEach(async () => {
		server = new GitServer();
		server.init({
			"a.md": note("A\n", 'updated: "2026-10-01T09:00:00+09:00"'),
			"README.md": note("r\n"),
			"sources/s.md": note("原文\n", 'updated: "2026-10-01T09:00:00+09:00"'),
			"plain.md": "frontmatter なし\n",
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

	it("新しいノートと変更したノートに、同じ時刻の updated が入る。created と本文は変わらない", async () => {
		await pc.write("new.md", note("新規\n"));
		await pc.write("a.md", note("A2\n", 'updated: "2026-10-01T09:00:00+09:00"'));
		await pc.git.push();
		for (const path of ["new.md", "a.md"]) {
			const remote = server.remoteFile(path) ?? "";
			expect(remote, path).toContain(`updated: "${ISO}"`);
			expect(remote, path).toContain('created: "2026-10-01T09:00:00+09:00"');
			expect(await pc.read(path), path).toBe(remote);
		}
		expect(server.remoteFile("a.md")).toContain("A2\n");
	});

	it("対象外・frontmatter なし・未変更・削除には付与しない", async () => {
		await pc.write("README.md", note("r2\n"));
		await pc.write("plain.md", "変更\n");
		await pc.write(".hidden/x.md", note("h\n"));
		await pc.write("template/file/n.md", note("t\n"));
		await pc.store.remove("a.md");
		await pc.git.push();
		expect(server.remoteFile("README.md")).toBe(note("r2\n"));
		expect(server.remoteFile("plain.md")).toBe("変更\n");
		expect(server.remoteFile("template/file/n.md")).toBe(note("t\n"));
		expect(() => server.remoteFile("a.md")).toThrow();
		expect(server.remoteFile("sources/s.md")).toBe(note("原文\n", 'updated: "2026-10-01T09:00:00+09:00"'));
	});

	it("付与のあとは変更なし(日時だけの循環コミットを起こさない)", async () => {
		await pc.write("new.md", note("新規\n"));
		expect(await pc.git.snapshot()).toBe(true);
		expect(await pc.git.snapshot()).toBe(false);
	});

	it("updated の行だけの差(他の端末から届いた変更)には付与しない", async () => {
		await pc.write("a.md", note("A\n", 'updated: "2026-10-15T09:00:00+09:00"'));
		expect(await pc.git.snapshot()).toBe(true);
		expect(await pc.read("a.md")).toBe(note("A\n", 'updated: "2026-10-15T09:00:00+09:00"'));
	});

	it("同期で受け取っただけのノートには付与しない", async () => {
		await phone.write("a.md", note("A phone\n", 'updated: "2026-10-01T09:00:00+09:00"'));
		await phone.git.push(); // 端末側で付与される
		const res = await pc.git.pull();
		expect(res.kind).toBe("fast-forward");
		expect(await pc.read("a.md")).toContain(`updated: "${ISO}"`);
		const commits = server.remoteLog().length;
		expect(await pc.git.snapshot()).toBe(false);
		expect(await pc.git.push()).toEqual({ kind: "nothing" });
		expect(server.remoteLog()).toHaveLength(commits);
	});

	it("両端末で別の行を編集したときの updated は衝突にならない", async () => {
		const base = note("1\n2\n3\n", 'updated: "2026-10-01T09:00:00+09:00"');
		await pc.write("m.md", base);
		await pc.git.push();
		await phone.git.pull();
		await phone.write("m.md", note("1 phone\n2\n3\n", 'updated: "2026-10-20T09:00:00+09:00"'));
		await phone.git.snapshot();
		await phone.git.push();
		await pc.write("m.md", note("1\n2\n3 pc\n", 'updated: "2026-10-25T09:00:00+09:00"'));
		const res = await pc.git.pull();
		expect(res.kind).toBe("merged");
		if (res.kind === "merged") expect(res.conflicts).toEqual([]);
		const merged = await pc.read("m.md");
		expect(merged).not.toContain("<<<<<<<");
		expect(merged.match(/updated:/g)).toHaveLength(1);
		expect(merged).toContain(`updated: "${ISO}"`);
		expect(merged).toContain("1 phone\n2\n3 pc\n");
	});

	it("本文が衝突しても updated の行はマーカーの外にある", async () => {
		await pc.write("m.md", note("1\n", 'updated: "2026-10-01T09:00:00+09:00"'));
		await pc.git.push();
		await phone.git.pull();
		await phone.write("m.md", note("phone\n", 'updated: "2026-10-20T09:00:00+09:00"'));
		await phone.git.push();
		await pc.write("m.md", note("pc\n", 'updated: "2026-10-25T09:00:00+09:00"'));
		const res = await pc.git.pull();
		expect(res.kind).toBe("merged");
		const merged = await pc.read("m.md");
		expect(merged).toContain("<<<<<<<");
		expect(merged.match(/updated:/g)).toHaveLength(1);
		expect(merged.indexOf("updated:")).toBeLessThan(merged.indexOf("<<<<<<<"));
	});

	it("新しい元資料(sources/)には付与し、コミット済みの元資料は変更されても付与しない", async () => {
		await pc.write("sources/t.md", note("新しい\n"));
		await pc.write("sources/s.md", note("書き換え\n", 'updated: "2026-10-01T09:00:00+09:00"'));
		await pc.git.push();
		expect(server.remoteFile("sources/t.md")).toContain(`updated: "${ISO}"`);
		expect(server.remoteFile("sources/s.md")).toBe(note("書き換え\n", 'updated: "2026-10-01T09:00:00+09:00"'));
	});

	it("曖昧な updated(重複)のノートは付与を見送り、同期は止めない", async () => {
		const bad = "---\ntype: note\nupdated: a\nupdated: b\n---\n本文\n";
		await pc.write("bad.md", bad);
		await pc.write("ok.md", note("ok\n"));
		await pc.git.push();
		expect(server.remoteFile("bad.md")).toBe(bad);
		expect(server.remoteFile("ok.md")).toContain(`updated: "${ISO}"`);
	});
});
