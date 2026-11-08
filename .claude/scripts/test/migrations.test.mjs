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
		".kit/migrations/9001-needs-ai/migrate.mjs": "export function migrate() { return []; }\n",
		".kit/migrations/9001-needs-ai/check.mjs": 'import { existsSync } from "node:fs"; import { join } from "node:path";\nexport function check(root) { return existsSync(join(root, "done.txt")) ? [] : ["done.txt がない"]; }\n',
		".kit/migrations/9002-later/migrate.mjs": 'import { writeFileSync } from "node:fs"; import { join } from "node:path";\nexport function migrate(root) { writeFileSync(join(root, "later.txt"), "x"); return ["later.txt を書く"]; }\n',
		".kit/migrations/9002-later/check.mjs": "export function check() { return []; }\n",
	});
	const first = node(root);
	assert.equal(first.status, 1);
	assert.match(first.stderr, /9001-needs-ai が終わっていない/);
	assert.match(first.stderr, /README\.md に従って/);
	assert.deepEqual(readRecord(root).migrations, listMigrations(root).filter((m) => m < "9001"));
	assert.ok(!existsSync(join(root, "later.txt")));

	const status = node(root, "--status");
	assert.equal(status.status, 1);
	assert.match(status.stderr, /未適用が 2 件/);

	// README に従って直した（AI が行う部分）後で、もう一度実行すると続きから進む
	write(root, { "done.txt": "" });
	const second = node(root, "--upstream=1111111111111111111111111111111111111111");
	assert.equal(second.status, 0, second.stderr);
	assert.deepEqual(readRecord(root).migrations, listMigrations(root));
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

const readJsonFile = (root, p) => JSON.parse(readFileSync(join(root, p), "utf8"));

test("新しい Vault（今の上流の設定）では、どの移行も何も変えない", async () => {
	const root = childFrom("fresh");
	// 適用済みの記録（.kit-local/upstream.json）だけは変わる
	const withoutRecord = (s) => Object.fromEntries(Object.entries(s).filter(([p]) => p !== join(".kit-local", "upstream.json")));
	const before = withoutRecord(snapshot(root));
	const { done, failed } = await runMigrations(root);
	assert.equal(failed, null);
	assert.deepEqual(
		done.flatMap((d) => d.changes),
		[],
	);
	assert.deepEqual(withoutRecord(snapshot(root)), before);
});

test("0002: コアプラグインのデイリーノートを無効にし、vault-ribbon を有効にする。ほかの設定は残し、既定のままの daily-notes.json は消す", async () => {
	const root = childFrom("legacy");
	const core = readJsonFile(root, ".obsidian/core-plugins.json");
	await runMigrations(root);
	assert.deepEqual(readJsonFile(root, ".obsidian/core-plugins.json"), { ...core, "daily-notes": false });
	// 0004 が後ろに vault-html を足す
	assert.deepEqual(readJsonFile(root, ".obsidian/community-plugins.json"), ["vault-git", "vault-task", "vault-template", "vault-ribbon", "vault-html"]);
	assert.ok(!existsSync(join(root, ".obsidian/daily-notes.json")));
	// Obsidian と同じく末尾に改行を付けない
	assert.ok(!readFileSync(join(root, ".obsidian/core-plugins.json"), "utf8").endsWith("\n"));
});

test("0002: 子が値を変えた daily-notes.json は残す", async () => {
	const root = childFrom("customized");
	const daily = readFileSync(join(root, ".obsidian/daily-notes.json"), "utf8");
	await runMigrations(root);
	assert.equal(readFileSync(join(root, ".obsidian/daily-notes.json"), "utf8"), daily);
	assert.equal(readJsonFile(root, ".obsidian/core-plugins.json")["daily-notes"], false);
});

test("0002: 読めない core-plugins.json は変えずに、check が失敗して止まる", async () => {
	const root = childFrom("legacy");
	write(root, { ".obsidian/core-plugins.json": "{壊れている" });
	const { failed } = await runMigrations(root);
	assert.equal(failed?.name, "0002-ribbon-and-core-daily-notes");
	assert.match(failed.problems.join(), /JSON として読めない/);
	assert.equal(readFileSync(join(root, ".obsidian/core-plugins.json"), "utf8"), "{壊れている");
});

test("0004: community-plugins.json に vault-html を足す。ほかの要素と順は残す", async () => {
	const root = childFrom("customized");
	const before = readJsonFile(root, ".obsidian/community-plugins.json");
	const { failed } = await runMigrations(root);
	assert.equal(failed, null);
	// 0002 が vault-ribbon を、0004 が vault-html を後ろに足す
	assert.deepEqual(readJsonFile(root, ".obsidian/community-plugins.json"), [...before, "vault-ribbon", "vault-html"]);
	assert.ok(!readFileSync(join(root, ".obsidian/community-plugins.json"), "utf8").endsWith("\n"));
});

test("0004: 読めない community-plugins.json は変えずに、check が失敗して止まる", async () => {
	const root = childFrom("fresh");
	// 0002 も同じファイルを読むので、0003 までを適用済みにして 0004 だけを実行する
	const record = JSON.parse(readFileSync(join(root, ".kit-local/upstream.json"), "utf8"));
	write(root, {
		".kit-local/upstream.json": JSON.stringify({ ...record, migrations: ["0001-template-overrides", "0002-ribbon-and-core-daily-notes", "0003-soft-deadline"] }),
		".obsidian/community-plugins.json": "[壊れている",
	});
	const { failed } = await runMigrations(root);
	assert.equal(failed?.name, "0004-html-viewer");
	assert.match(failed.problems.join(), /JSON として読めない/);
	assert.equal(readFileSync(join(root, ".obsidian/community-plugins.json"), "utf8"), "[壊れている");
});

test("0003: issue と template の frontmatter の mid_due を soft_deadline にする。値・本文・ほかの issue は変えない", async () => {
	const root = childFrom("legacy");
	write(root, { "template/file/task.md": "---\ntype: issue\nmid_due: \"{{date}}\"\n---\n\n本文\n" });
	const other = readFileSync(join(root, "issue/i-2.md"), "utf8");
	await runMigrations(root);
	const text = readFileSync(join(root, "issue/i-1.md"), "utf8");
	assert.match(text, /^soft_deadline: 2026-01-10$/m);
	assert.doesNotMatch(text, /^mid_due:/m);
	assert.match(text, /本文の mid_due: はキーではないので変えない。/);
	assert.equal(readFileSync(join(root, "template/file/task.md"), "utf8"), '---\ntype: issue\nsoft_deadline: "{{date}}"\n---\n\n本文\n');
	assert.equal(readFileSync(join(root, "issue/i-2.md"), "utf8"), other);
	assert.deepEqual(readJsonFile(root, ".obsidian/types.json"), { types: { soft_deadline: "date", deadline: "date" } });
});

test("0003: CRLF の issue も、行末を変えずに書き換える", async () => {
	const root = childFrom("legacy");
	write(root, { "issue/i-3.md": "---\r\ntype: issue\r\nid: i-3\r\nmid_due: 2026-01-10\r\n---\r\n" });
	await runMigrations(root);
	assert.equal(readFileSync(join(root, "issue/i-3.md"), "utf8"), "---\r\ntype: issue\r\nid: i-3\r\nsoft_deadline: 2026-01-10\r\n---\r\n");
});

test("0003: mid_due と soft_deadline の両方を持つ issue は変えずに、check が失敗して止まる", async () => {
	const root = childFrom("legacy");
	const both = "---\ntype: issue\nid: i-3\nmid_due: 2026-01-10\nsoft_deadline: 2026-01-12\n---\n";
	write(root, { "issue/i-3.md": both });
	const { failed } = await runMigrations(root);
	assert.equal(failed?.name, "0003-soft-deadline");
	assert.match(failed.problems.join(), /issue\/i-3\.md: frontmatter に mid_due と soft_deadline の両方がある/);
	assert.equal(readFileSync(join(root, "issue/i-3.md"), "utf8"), both);
});

test("0003: types.json に soft_deadline がすでにあれば、mid_due を消すだけ", async () => {
	const root = childFrom("legacy");
	write(root, { ".obsidian/types.json": JSON.stringify({ types: { mid_due: "text", soft_deadline: "date" } }, null, 2) });
	await runMigrations(root);
	assert.deepEqual(readJsonFile(root, ".obsidian/types.json"), { types: { soft_deadline: "date" } });
});
