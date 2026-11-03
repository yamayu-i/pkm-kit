#!/usr/bin/env node
// SessionStart フック: 子の Vault で、まだ取り込んでいない上流の更新と、未適用の移行があれば Claude に伝える（ADR-0010）。
// 上流（.kit-local/ がない）では何も出さない。上流の取得はネットワークが要るので、失敗したら手元の upstream/main で判断する
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
if (!existsSync(join(root, ".kit-local/upstream.json"))) process.exit(0);

const git = (args, timeout = 3000) => spawnSync("git", args, { cwd: root, encoding: "utf8", timeout });
let record;
try {
	record = JSON.parse(readFileSync(join(root, ".kit-local/upstream.json"), "utf8"));
} catch {
	process.exit(0);
}
const branch = record.branch ?? "main";
const hasRemote = git(["remote", "get-url", "upstream"]).status === 0;
if (hasRemote) git(["fetch", "--quiet", "upstream", branch], 8000);

const messages = [];
const head = hasRemote ? git(["rev-parse", "--verify", "--quiet", `upstream/${branch}`]).stdout.trim() : "";
if (head && record.commit && head !== record.commit) {
	const count = git(["rev-list", "--count", `${record.commit}..${head}`]);
	const n = count.status === 0 ? Number(count.stdout.trim()) : null;
	if (n !== 0) messages.push(`上流に未取り込みの更新があります（${n ?? "?"} コミット）`);
}
const status = spawnSync(process.execPath, [join(root, ".kit/migrate.mjs"), "--status", root], { encoding: "utf8", timeout: 5000 });
if (status.status === 1) messages.push("未適用の移行があります");

if (messages.length) console.log(`[vault-upgrade] ${messages.join("。")}。ユーザーに vault-upgrade（上流の更新の取り込み）を提案してください。`);
else if (hasRemote) console.log(`[vault-upgrade] OK（上流 ${String(record.commit).slice(0, 7)} を取り込み済み）`);
else console.log("[vault-upgrade] 上流の remote（upstream）がありません。git remote add upstream <上流の URL> で足すと、更新を知らせられます。");
