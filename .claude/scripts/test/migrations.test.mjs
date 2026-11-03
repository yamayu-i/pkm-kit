import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listMigrations, readRecord, runMigrations } from "../../../.kit/migrate.mjs";
import { tempVault, write } from "./helpers.mjs";

const here = fileURLToPath(new URL("../../..", import.meta.url));
const FIXTURES = join(here, ".kit/fixtures");
const fixtures = readdirSync(FIXTURES, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

/** fixture を一時フォルダに写し、上流から届く移行の仕組みを置いた子の Vault にする */
function childFrom(fixture) {
	const root = tempVault();
	cpSync(join(FIXTURES, fixture), root, { recursive: true });
	cpSync(join(here, ".kit/migrate.mjs"), join(root, ".kit/migrate.mjs"));
	cpSync(join(here, ".kit/migrations"), join(root, ".kit/migrations"), { recursive: true });
	return root;
}

/** .kit/ を除いた、子のファイルの中身の一覧 */
function snapshot(root) {
	const out = {};
	const walk = (dir) => {
		for (const name of readdirSync(dir)) {
			const p = join(dir, name);
			const rel = relative(root, p);
			if (rel === ".kit") continue;
			if (statSync(p).isDirectory()) walk(p);
			else out[rel] = readFileSync(p, "utf8");
		}
	};
	walk(root);
	return out;
}

const node = (root, ...args) => spawnSync(process.execPath, [join(root, ".kit/migrate.mjs"), ...args, root], { encoding: "utf8" });

test("fixture がある", () => {
	assert.ok(fixtures.includes("fresh") && fixtures.includes("legacy") && fixtures.includes("customized"));
});

for (const fixture of fixtures) {
	test(`すべての移行: ${fixture} で check が通り、適用済みに記録され、2 回目は何も変えない`, async () => {
		const root = childFrom(fixture);
		const first = await runMigrations(root);
		assert.equal(first.failed, null, JSON.stringify(first.failed));
		assert.deepEqual(readRecord(root).migrations, listMigrations(root));

		for (const name of listMigrations(root)) {
			const { check } = await import(pathToFileURL(join(root, ".kit/migrations", name, "check.mjs")).href);
			assert.deepEqual(check(root), [], name);
		}

		// 記録を消してもう一度実行しても、中身は変わらない（冪等）
		const after = snapshot(root);
		const record = readRecord(root);
		writeFileSync(join(root, ".kit-local/upstream.json"), `${JSON.stringify({ ...record, migrations: [] }, null, 2)}\n`);
		const second = await runMigrations(root);
		assert.equal(second.failed, null);
		assert.deepEqual(
			second.done.flatMap((d) => d.changes),
			[],
		);
		assert.deepEqual(snapshot(root), after);
	});
}

test("0001: 切り出す前からの Vault は、上流と同じ写しと設定がすべて消える。ノートは変えない", async () => {
	const root = childFrom("legacy");
	const daily = readFileSync(join(root, "daily/2026/01/2026-01-01.md"), "utf8");
	await runMigrations(root);
	assert.ok(!existsSync(join(root, "template")));
	assert.equal(readFileSync(join(root, "daily/2026/01/2026-01-01.md"), "utf8"), daily);
});

test("0001: 変えたテンプレートと子だけのテンプレートは残し、設定は上流と違う項目だけにする", async () => {
	const root = childFrom("customized");
	const note = readFileSync(join(root, "template/file/note.md"), "utf8");
	await runMigrations(root);
	assert.deepEqual(readdirSync(join(root, "template/file")).sort(), ["mine.md", "note.md"]);
	assert.equal(readFileSync(join(root, "template/file/note.md"), "utf8"), note);
	const { templates } = JSON.parse(readFileSync(join(root, "template/config.json"), "utf8"));
	// 並び順はすべて残し、値は上流と違うものだけ
	assert.deepEqual(templates.slice(0, 2), [
		{ file: "daily.md", enabled: true },
		{ file: "note.md", folder: "memo" },
	]);
	assert.deepEqual(templates.at(-1), { file: "mine.md", enabled: true, folder: "mine", fileNamePattern: "" });
	assert.ok(templates.slice(2, -1).every((t) => Object.keys(t).length === 1));
});

test("0001: 読めない template/config.json は変えずに、check が失敗して止まる", async () => {
	const root = childFrom("fresh");
	write(root, { "template/config.json": "{壊れている" });
	const { failed } = await runMigrations(root);
	assert.equal(failed?.name, "0001-template-overrides");
	assert.match(failed.problems.join(), /JSON として読めない/);
	assert.equal(readFileSync(join(root, "template/config.json"), "utf8"), "{壊れている");
	assert.deepEqual(readRecord(root).migrations, []);
});

test("実行の仕組み: check が失敗した移行で止め、記録しない。後の移行も実行しない", async () => {
	const root = childFrom("fresh");
	write(root, {
		".kit/migrations/0002-needs-ai/migrate.mjs": "export function migrate() { return []; }\n",
		".kit/migrations/0002-needs-ai/check.mjs": 'import { existsSync } from "node:fs"; import { join } from "node:path";\nexport function check(root) { return existsSync(join(root, "done.txt")) ? [] : ["done.txt がない"]; }\n',
		".kit/migrations/0003-later/migrate.mjs": 'import { writeFileSync } from "node:fs"; import { join } from "node:path";\nexport function migrate(root) { writeFileSync(join(root, "later.txt"), "x"); return ["later.txt を書く"]; }\n',
		".kit/migrations/0003-later/check.mjs": "export function check() { return []; }\n",
	});
	const first = node(root);
	assert.equal(first.status, 1);
	assert.match(first.stderr, /0002-needs-ai が終わっていない/);
	assert.match(first.stderr, /README\.md に従って/);
	assert.deepEqual(readRecord(root).migrations, ["0001-template-overrides"]);
	assert.ok(!existsSync(join(root, "later.txt")));

	const status = node(root, "--status");
	assert.equal(status.status, 1);
	assert.match(status.stderr, /未適用が 2 件/);

	// README に従って直した（AI が行う部分）後で、もう一度実行すると続きから進む
	write(root, { "done.txt": "" });
	const second = node(root, "--upstream=1111111111111111111111111111111111111111");
	assert.equal(second.status, 0, second.stderr);
	assert.deepEqual(readRecord(root).migrations, ["0001-template-overrides", "0002-needs-ai", "0003-later"]);
	assert.equal(readRecord(root).commit, "1111111111111111111111111111111111111111");
	assert.equal(node(root, "--status").status, 0);
});

test("実行の仕組み: --dry-run は書かない。上流（.kit-local/ がない）では --status は対象外で通る", () => {
	const root = childFrom("legacy");
	const dry = node(root, "--dry-run");
	assert.equal(dry.status, 0, dry.stderr);
	assert.match(dry.stdout, /（予定）/);
	assert.ok(existsSync(join(root, "template/config.json")));
	assert.deepEqual(readRecord(root).migrations, []);

	const upstream = tempVault();
	cpSync(join(here, ".kit/migrate.mjs"), join(upstream, ".kit/migrate.mjs"));
	const r = node(upstream, "--status");
	assert.equal(r.status, 0);
	assert.match(r.stdout, /上流なので対象外/);
});
