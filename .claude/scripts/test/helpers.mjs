import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after } from "node:test";

/** 一時ディレクトリにファイルを書く。files は { パス: 中身 }。 */
export function tempVault(files = {}) {
	const root = mkdtempSync(join(tmpdir(), "vault-"));
	after(() => rmSync(root, { recursive: true, force: true }));
	write(root, files);
	return root;
}

export function write(root, files) {
	for (const [p, text] of Object.entries(files)) {
		mkdirSync(dirname(join(root, p)), { recursive: true });
		writeFileSync(join(root, p), text);
	}
}

export function tempRepo(files = {}) {
	const root = tempVault();
	git(root, "init", "-q", "-b", "main");
	git(root, "config", "user.name", "test");
	git(root, "config", "user.email", "test@example.com");
	git(root, "config", "commit.gpgsign", "false");
	if (Object.keys(files).length) commit(root, "init", files);
	return root;
}

export function commit(root, message, files = {}, remove = []) {
	write(root, files);
	for (const p of remove) git(root, "rm", "-q", p);
	git(root, "add", "-A");
	git(root, "commit", "-q", "--allow-empty", "-m", message);
	return git(root, "rev-parse", "--short", "HEAD").trim();
}

export function git(root, ...args) {
	return execFileSync("git", args, { cwd: root, encoding: "utf8" });
}

export const page = (fields = {}) => {
	const fm = { title: "T", type: "concept", created: "2026-10-01T09:00:00+09:00", updated: "2026-10-01T09:00:00+09:00", ...fields };
	const lines = Object.entries(fm).map(([k, v]) => (Array.isArray(v) ? `${k}:\n${v.map((x) => `  - ${x}`).join("\n")}` : `${k}: ${v}`));
	if (!("sources" in fields)) lines.push("sources: []");
	return `---\n${lines.join("\n")}\n---\n\n本文\n`;
};
