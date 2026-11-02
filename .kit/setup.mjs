#!/usr/bin/env node
/**
 * 子の Vault のセットアップ（ADR-0009、ADR-0011）。新しい Vault でも、既存の Vault でも使える。
 * 何度実行しても同じ結果になる。子のもの（ノート、template/、.obsidian/*.json の残りのキーなど）は消さない。
 *
 * 1. .kit-local/config.json に、エスカレーションの方法を書く（なければ尋ねる）
 * 2. .kit-local/upstream.json に、取り込んだ上流のコミットと、適用済みの移行を書く（なければ）
 * 3. .obsidian/*.json に、.kit/obsidian-required.json の必要なキーだけを合わせる
 * 4. 子のものの初期値を置く（issue/labels.json、issue/board-groups.json。なければ）
 * 5. git の作業ツリーなら、pre-commit フック（.githooks）を有効にする
 *
 * 使い方:
 *   node .kit/setup.mjs [--escalation=issue|file|none] [--escalation-repo=<owner/name>] [--dry-run] [<Vault のルート>]
 *
 * --escalation を付けず、すでに .kit-local/config.json もなければ、端末で尋ねる（端末でなければ失敗する）。
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { applyObsidianRequired, readRequired } from "./lib/obsidian-required.mjs";

export const METHODS = ["issue", "file", "none"];

export const SEEDS = {
	"issue/labels.json": `${JSON.stringify(
		[
			{ name: "仕事", color: "#c6e6ff" },
			{ name: "私用", color: "#d9f5d0" },
		],
		null,
		2,
	)}\n`,
	"issue/board-groups.json": `${JSON.stringify([{ name: "午前" }, { name: "午後" }], null, 2)}\n`,
};

function git(root, args) {
	return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
}

function tryGit(root, args) {
	try {
		return git(root, args);
	} catch {
		return null;
	}
}

export function readKit(root) {
	return JSON.parse(readFileSync(join(root, ".kit/kit.json"), "utf8"));
}

function readJson(path) {
	return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : undefined;
}

function writeJson(path, value) {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

/** エスカレーションの設定を組み立てる。method は issue / file / none */
export function escalationConfig(method, repo) {
	if (!METHODS.includes(method)) throw new Error(`エスカレーションの方法は ${METHODS.join(" / ")} のどれか: ${method}`);
	if (method === "issue") {
		if (!/^[\w.-]+\/[\w.-]+$/.test(repo ?? "")) throw new Error(`issue のときは、上流のリポジトリを owner/name で指定する: ${repo}`);
		return { method, repo, label: "escalation" };
	}
	return { method };
}

/** 上流の取り込みの記録。上流の remote（upstream/<branch>）があればそのコミット、なければ HEAD */
export function upstreamRecord(root, kit) {
	const commit = tryGit(root, ["rev-parse", "--verify", "--quiet", `upstream/${kit.branch}`]) ?? tryGit(root, ["rev-parse", "--verify", "--quiet", "HEAD"]);
	const dir = join(root, ".kit/migrations");
	// 新しい Vault は最新の形で始まるので、今ある移行はすべて適用済みとして扱う（ADR-0010）
	const migrations = existsSync(dir)
		? readdirSync(dir, { withFileTypes: true })
				.filter((d) => d.isDirectory() && /^\d{4}-/.test(d.name))
				.map((d) => d.name)
				.sort()
		: [];
	return { repo: kit.repo, url: kit.url, branch: kit.branch, commit, migrations };
}

/**
 * セットアップを行い、行ったこと（行う予定のこと）の一覧を返す。
 * escalation が null で、.kit-local/config.json もなければ失敗する（呼ぶ側で尋ねる）
 */
export function setup(root, { escalation = null, dryRun = false } = {}) {
	const done = [];
	const kit = readKit(root);
	const say = (msg) => done.push(dryRun ? `（予定）${msg}` : msg);

	const configPath = join(root, ".kit-local/config.json");
	const config = readJson(configPath);
	if (escalation) {
		if (JSON.stringify(config?.escalation) !== JSON.stringify(escalation)) {
			if (!dryRun) writeJson(configPath, { ...(config ?? {}), escalation });
			say(`.kit-local/config.json: エスカレーションを ${escalation.method} にする`);
		}
	} else if (!config?.escalation) {
		throw new Error("エスカレーションの方法が決まっていない。--escalation=issue|file|none を付ける");
	}

	const upstreamPath = join(root, ".kit-local/upstream.json");
	if (!existsSync(upstreamPath)) {
		const record = upstreamRecord(root, kit);
		if (!dryRun) writeJson(upstreamPath, record);
		say(`.kit-local/upstream.json: 上流のコミット ${record.commit ?? "（なし）"} と、適用済みの移行 ${record.migrations.length} 件を記録する`);
	}

	for (const c of applyObsidianRequired(join(root, ".obsidian"), readRequired(root), { dryRun })) {
		say("item" in c ? `.obsidian/${c.file}: ${JSON.stringify(c.item)} を足す` : `.obsidian/${c.file}: ${c.key} を ${JSON.stringify(c.to)} にする`);
	}

	for (const [path, text] of Object.entries(SEEDS)) {
		const full = join(root, path);
		if (existsSync(full)) continue;
		if (!dryRun) {
			mkdirSync(dirname(full), { recursive: true });
			writeFileSync(full, text);
		}
		say(`${path}: 初期値を置く`);
	}

	if (existsSync(join(root, ".git")) && tryGit(root, ["config", "--get", "core.hooksPath"]) !== ".githooks") {
		if (!dryRun) git(root, ["config", "core.hooksPath", ".githooks"]);
		say("git: core.hooksPath を .githooks にする（PC の Git CLI でも updated を付与する）");
	}
	return done;
}

function arg(name) {
	const hit = process.argv.slice(2).find((a) => a.startsWith(`--${name}=`));
	return hit ? hit.slice(name.length + 3) : null;
}

async function ask(kit) {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	try {
		console.log("この Vault で、上流（pkm-kit）を変えないと直らない問題を見つけたときの伝え方を選ぶ（ADR-0011）。後から変えられる。");
		console.log("  issue: 上流に GitHub の Issue を立てる（送る前に下書きを確認する）");
		console.log("  file:  .kit-local/escalations/ に書くだけ。上流に伝えるのは人が行う");
		console.log("  none:  評価のレポートに残すだけ");
		let method = "";
		while (!METHODS.includes(method)) method = (await rl.question("方法 [issue/file/none]: ")).trim();
		let repo = null;
		if (method === "issue") repo = (await rl.question(`上流のリポジトリ [${kit.repo}]: `)).trim() || kit.repo;
		return escalationConfig(method, repo);
	} finally {
		rl.close();
	}
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const positional = process.argv.slice(2).filter((a) => !a.startsWith("--"));
	const root = resolve(positional[0] ?? fileURLToPath(new URL("..", import.meta.url)));
	const dryRun = process.argv.includes("--dry-run");
	try {
		const kit = readKit(root);
		const method = arg("escalation");
		let escalation = method ? escalationConfig(method, arg("escalation-repo") ?? kit.repo) : null;
		if (!escalation && !readJson(join(root, ".kit-local/config.json"))?.escalation) {
			if (!process.stdin.isTTY) throw new Error("エスカレーションの方法が決まっていない。--escalation=issue|file|none を付ける");
			escalation = await ask(kit);
		}
		const done = setup(root, { escalation, dryRun });
		for (const d of done) console.log(`- ${d}`);
		console.log(done.length ? `セットアップ: ${done.length} 件${dryRun ? "（--dry-run なので書いていない）" : ""}` : "セットアップ: 変えるものはない");
	} catch (e) {
		console.error(`setup: ${e.message}`);
		process.exit(1);
	}
}
