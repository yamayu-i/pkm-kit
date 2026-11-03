#!/usr/bin/env node
/**
 * 子の Vault で、上流の移行（.kit/migrations/NNNN-名前/）を番号の順に実行する（ADR-0010）。依存なしの Node。
 * 適用済みの移行は .kit-local/upstream.json の migrations に記録する。
 *
 * 移行ごとに migrate.mjs（機械的にできる部分）を実行し、check.mjs（終わった状態か）で確かめる。
 * check.mjs が失敗したら、そこで止める。README.md に従って残りを直し（AI か人）、もう一度実行する。
 *
 * 使い方:
 *   node .kit/migrate.mjs [--upstream=<commit>] [--dry-run] [<Vault のルート>]
 *       未適用の移行を実行する。--upstream は、取り込んだ上流のコミットを記録する（vault-upgrade が使う）
 *   node .kit/migrate.mjs --status [<Vault のルート>]
 *       未適用の移行を表示する。あれば終了コード 1（verify と CI が使う）。上流（.kit-local/ がない）では何もしない
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RECORD = ".kit-local/upstream.json";

export function listMigrations(root) {
	const dir = join(root, ".kit/migrations");
	if (!existsSync(dir)) return [];
	return readdirSync(dir, { withFileTypes: true })
		.filter((d) => d.isDirectory() && /^\d{4}-[a-z0-9-]+$/.test(d.name))
		.map((d) => d.name)
		.sort();
}

export function readRecord(root) {
	return JSON.parse(readFileSync(join(root, RECORD), "utf8"));
}

function writeRecord(root, record) {
	writeFileSync(join(root, RECORD), `${JSON.stringify(record, null, 2)}\n`);
}

export function pendingMigrations(root) {
	const applied = new Set(readRecord(root).migrations ?? []);
	return listMigrations(root).filter((m) => !applied.has(m));
}

async function load(root, name, file) {
	return import(pathToFileURL(join(root, ".kit/migrations", name, file)).href);
}

/**
 * 未適用の移行を順に実行する。check が失敗した移行で止める。
 * 戻り値: { done: [{ name, changes }], failed: { name, problems, readme } | null }
 */
export async function runMigrations(root, { dryRun = false, upstream = null } = {}) {
	const record = readRecord(root);
	if (upstream) {
		if (!/^[0-9a-f]{40}$/.test(upstream)) throw new Error(`--upstream は 40 桁のコミットにする: ${upstream}`);
		record.commit = upstream;
		if (!dryRun) writeRecord(root, record);
	}
	const done = [];
	for (const name of pendingMigrations(root)) {
		const { migrate } = await load(root, name, "migrate.mjs");
		const { check } = await load(root, name, "check.mjs");
		const changes = migrate(root, { dryRun });
		if (dryRun) {
			done.push({ name, changes });
			continue;
		}
		const problems = check(root);
		if (problems.length) return { done, failed: { name, problems, readme: `.kit/migrations/${name}/README.md` } };
		record.migrations = [...(record.migrations ?? []), name];
		writeRecord(root, record);
		done.push({ name, changes });
	}
	return { done, failed: null };
}

function arg(name) {
	const hit = process.argv.slice(2).find((a) => a.startsWith(`--${name}=`));
	return hit ? hit.slice(name.length + 3) : null;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const positional = process.argv.slice(2).filter((a) => !a.startsWith("--"));
	const root = resolve(positional[0] ?? fileURLToPath(new URL("..", import.meta.url)));
	try {
		if (!existsSync(join(root, ".kit-local"))) {
			if (process.argv.includes("--status")) {
				console.log("移行: 上流なので対象外");
				process.exit(0);
			}
			throw new Error(".kit-local/ がない。子の Vault で実行する（先に node .kit/setup.mjs）");
		}
		if (process.argv.includes("--status")) {
			const pending = pendingMigrations(root);
			if (pending.length) {
				console.error(`移行: 未適用が ${pending.length} 件（node .kit/migrate.mjs で実行する。vault-upgrade の手順）`);
				for (const p of pending) console.error(`  ${p}`);
				process.exit(1);
			}
			console.log("移行: 未適用なし");
			process.exit(0);
		}
		let upstream = arg("upstream");
		if (upstream && !/^[0-9a-f]{40}$/.test(upstream)) {
			upstream = execFileSync("git", ["rev-parse", "--verify", `${upstream}^{commit}`], { cwd: root, encoding: "utf8" }).trim();
		}
		const dryRun = process.argv.includes("--dry-run");
		const { done, failed } = await runMigrations(root, { dryRun, upstream });
		for (const d of done) {
			console.log(`- ${d.name}${dryRun ? "（予定）" : ""}`);
			for (const c of d.changes) console.log(`    ${c}`);
		}
		if (failed) {
			console.error(`移行 ${failed.name} が終わっていない。${failed.readme} に従って直し、もう一度実行する:`);
			for (const p of failed.problems) console.error(`  ${p}`);
			process.exit(1);
		}
		console.log(done.length ? `移行: ${done.length} 件${dryRun ? "（--dry-run なので書いていない）" : "を適用した"}` : "移行: 未適用なし");
	} catch (e) {
		console.error(`migrate: ${e.message}`);
		process.exit(1);
	}
}
