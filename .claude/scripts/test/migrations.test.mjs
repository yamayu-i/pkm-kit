import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listMigrations, readRecord, runMigrations } from "../../../.kit/migrate.mjs";
import { commit, git, tempRepo, tempVault, write } from "./helpers.mjs";

const here = fileURLToPath(new URL("../../..", import.meta.url));
const FIXTURES = join(here, ".kit/fixtures");
const fixtures = readdirSync(FIXTURES, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

/** fixture を一時フォルダに写し、上流から届く移行の仕組みを置いた子の Vault にする */
function childFrom(fixture) {
	const root = tempVault();
	cpSync(join(FIXTURES, fixture), root, { recursive: true });
	cpSync(join(here, ".kit/migrate.mjs"), join(root, ".kit/migrate.mjs"));
	cpSync(join(here, ".kit/migrations"), join(root, ".kit/migrations"), { recursive: true });
	// 移行が使う上流の CLI（0129 の theme.mjs）。子の Vault には上流から届いている
	cpSync(join(here, ".kit/bin/theme.mjs"), join(root, ".kit/bin/theme.mjs"));
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
	// 0061 が template/config.json を消すので、0001 だけを実行して途中の形を確かめる
	const { migrate } = await import(pathToFileURL(join(here, ".kit/migrations/0001-template-overrides/migrate.mjs")).href);
	migrate(root);
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
	assert.deepEqual(readJsonFile(root, ".obsidian/core-plugins.json"), { ...core, "daily-notes": false, "tag-pane": false });
	// 0005 が後ろに vault-html を足し、0058 がすべてを pkm-* に改名し、0064 が pkm-drawio を（0102 が pkm-diagram に改名）、0070 が pkm-updates を、0072 が pkm-view-selector を、0120 が pkm-slide を、0128 が pkm-markdown を足す
	assert.deepEqual(readJsonFile(root, ".obsidian/community-plugins.json"), ["pkm-git", "pkm-task", "pkm-template", "pkm-ribbon", "pkm-html", "pkm-diagram", "pkm-updates", "pkm-view-selector", "pkm-slide", "pkm-markdown"]);
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

test("0005: community-plugins.json に vault-html を足す。ほかの要素と順は残す", async () => {
	const root = childFrom("customized");
	const before = readJsonFile(root, ".obsidian/community-plugins.json");
	const { failed } = await runMigrations(root);
	assert.equal(failed, null);
	// 0002 が vault-ribbon を、0005 が vault-html を後ろに足し、0058 が pkm-* に改名し、0064 が pkm-drawio を（0102 が pkm-diagram に改名）、0070 が pkm-updates を、0072 が pkm-view-selector を、0120 が pkm-slide を、0128 が pkm-markdown を足す
	assert.deepEqual(readJsonFile(root, ".obsidian/community-plugins.json"), [...before.map((id) => id.replace(/^vault-/, "pkm-")), "pkm-ribbon", "pkm-html", "pkm-diagram", "pkm-updates", "pkm-view-selector", "pkm-slide", "pkm-markdown"]);
	assert.ok(!readFileSync(join(root, ".obsidian/community-plugins.json"), "utf8").endsWith("\n"));
});

test("0005: 読めない community-plugins.json は変えずに、check が失敗して止まる", async () => {
	const root = childFrom("fresh");
	// 0002 も同じファイルを読むので、0004 までを適用済みにして 0005 だけを実行する
	const record = JSON.parse(readFileSync(join(root, ".kit-local/upstream.json"), "utf8"));
	write(root, {
		".kit-local/upstream.json": JSON.stringify({ ...record, migrations: ["0001-template-overrides", "0002-ribbon-and-core-daily-notes", "0003-soft-deadline", "0004-member-nickname-alias"] }),
		".obsidian/community-plugins.json": "[壊れている",
	});
	const { failed } = await runMigrations(root);
	assert.equal(failed?.name, "0005-html-viewer");
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

test("0004: nickname と alias のない member に、name と同じ値と ID を足す。値・本文・持っている member は変えない", async () => {
	const root = childFrom("legacy");
	const has = readFileSync(join(root, "member/m-2.md"), "utf8");
	await runMigrations(root);
	assert.equal(
		readFileSync(join(root, "member/m-1.md"), "utf8"),
		'---\nschema: 1\ntype: member\nid: m-1\nname: "佐藤 花子"\nnickname: "佐藤 花子"\nalias: m-1\ncreated: 2026-01-01T09:00:00+09:00\nupdated: 2026-01-01T09:00:00+09:00\n---\n\n本文の nickname: はキーではないので変えない。\n',
	);
	assert.equal(readFileSync(join(root, "member/m-2.md"), "utf8"), has);
});

test("0004: CRLF の member も行末を変えずに足す。片方だけないときは、ないものだけを足す", async () => {
	const root = childFrom("legacy");
	write(root, {
		"member/m-3.md": "---\r\ntype: member\r\nid: m-3\r\nname: 田中\r\n---\r\n",
		"member/m-4.md": "---\ntype: member\nid: m-4\nname: 高橋\nalias: taka\n---\n",
	});
	await runMigrations(root);
	assert.equal(readFileSync(join(root, "member/m-3.md"), "utf8"), "---\r\ntype: member\r\nid: m-3\r\nname: 田中\r\nnickname: 田中\r\nalias: m-3\r\n---\r\n");
	assert.equal(readFileSync(join(root, "member/m-4.md"), "utf8"), "---\ntype: member\nid: m-4\nname: 高橋\nnickname: 高橋\nalias: taka\n---\n");
});

test("0004: name か id が 1 行の値で読めない member は変えずに、check が失敗して止まる", async () => {
	const root = childFrom("legacy");
	const block = "---\ntype: member\nid: m-5\nname: |\n  複数行\n---\n";
	write(root, { "member/m-5.md": block });
	const { failed } = await runMigrations(root);
	assert.equal(failed?.name, "0004-member-nickname-alias");
	assert.match(failed.problems.join(), /member\/m-5\.md/);
	assert.equal(readFileSync(join(root, "member/m-5.md"), "utf8"), block);
});

test("0006: 追跡中の tmp/ のファイルは変えずに、check が一覧を出して止まる。追跡を外せば通る", async () => {
	const root = tempRepo({ "tmp/a.md": "a\n", "tmp/sub/b.html": "<p>b</p>\n", "note.md": "n\n" });
	const { migrate } = await import(pathToFileURL(join(here, ".kit/migrations/0006-tmp-untracked/migrate.mjs")).href);
	const { check } = await import(pathToFileURL(join(here, ".kit/migrations/0006-tmp-untracked/check.mjs")).href);
	assert.equal(migrate(root).length, 1);
	assert.deepEqual(git(root, "ls-files").trim().split("\n").sort(), ["note.md", "tmp/a.md", "tmp/sub/b.html"]);
	assert.deepEqual(
		check(root).map((p) => p.split(":")[0]),
		["tmp/a.md", "tmp/sub/b.html"],
	);

	git(root, "rm", "-r", "-q", "--cached", "--", "tmp");
	commit(root, "untrack tmp", { ".gitignore": "tmp/\n" });
	assert.deepEqual(check(root), []);
	assert.deepEqual(migrate(root), []);
	assert.ok(existsSync(join(root, "tmp/a.md")));
});

test("0058: community-plugins.json・appearance.json・hotkeys.json の vault-* を pkm-* にする。子が足したものと順は残す", async () => {
	const root = childFrom("customized");
	const { failed } = await runMigrations(root);
	assert.equal(failed, null);
	const community = readJsonFile(root, ".obsidian/community-plugins.json");
	assert.ok(community.every((id) => !id.startsWith("vault-")), JSON.stringify(community));
	assert.deepEqual(readJsonFile(root, ".obsidian/appearance.json"), { accentColor: "#6750a4", enabledCssSnippets: ["pkm-theme", "my-snippet"] });
	const hotkeys = readJsonFile(root, ".obsidian/hotkeys.json");
	assert.deepEqual(Object.keys(hotkeys), ["pkm-template:new-from-template", "editor:toggle-bold", "editor:insert-link"]);
	assert.deepEqual(hotkeys["pkm-template:new-from-template"], [{ modifiers: ["Mod"], key: "N" }]);
	// Obsidian と同じく末尾に改行を付けない
	assert.ok(!readFileSync(join(root, ".obsidian/hotkeys.json"), "utf8").endsWith("\n"));
});

test("0058: 新旧の両方があれば、新しい方を残して古い方を除く", async () => {
	const root = childFrom("fresh");
	write(root, {
		".obsidian/community-plugins.json": JSON.stringify(["vault-git", "pkm-git", "other"]),
		".obsidian/hotkeys.json": JSON.stringify({ "vault-task:open-daily": [{ modifiers: ["Mod"], key: "D" }], "pkm-task:open-daily": [] }),
	});
	const { failed } = await runMigrations(root);
	assert.equal(failed, null);
	// 0064 が pkm-drawio を（0102 が pkm-diagram に改名）、0070 が pkm-updates を、0072 が pkm-view-selector を、0120 が pkm-slide を、0128 が pkm-markdown を後ろに足す
	assert.deepEqual(readJsonFile(root, ".obsidian/community-plugins.json"), ["pkm-git", "other", "pkm-ribbon", "pkm-html", "pkm-diagram", "pkm-updates", "pkm-view-selector", "pkm-slide", "pkm-markdown"]);
	assert.deepEqual(readJsonFile(root, ".obsidian/hotkeys.json"), { "pkm-task:open-daily": [], "editor:insert-link": [] });
});

test("0058: この端末の旧 ID の data.json を新しい ID へ写し、data.json だけが残る古いフォルダを消す", async () => {
	const root = childFrom("fresh");
	write(root, {
		".obsidian/plugins/vault-git/data.json": '{"deviceName":"pc"}',
		".obsidian/plugins/vault-task/data.json": '{"deviceName":"old"}',
		".obsidian/plugins/pkm-task/data.json": '{"deviceName":"new"}',
		".obsidian/plugins/vault-html/data.json": "{}",
		".obsidian/plugins/vault-html/memo.txt": "子のファイル",
	});
	const { failed } = await runMigrations(root);
	assert.equal(failed, null);
	assert.equal(readFileSync(join(root, ".obsidian/plugins/pkm-git/data.json"), "utf8"), '{"deviceName":"pc"}');
	assert.ok(!existsSync(join(root, ".obsidian/plugins/vault-git")));
	// 新しい方がすでにあれば、上書きせず、古い方も消さない
	assert.equal(readFileSync(join(root, ".obsidian/plugins/pkm-task/data.json"), "utf8"), '{"deviceName":"new"}');
	assert.ok(existsSync(join(root, ".obsidian/plugins/vault-task/data.json")));
	// data.json 以外のファイルがあるフォルダは消さない
	assert.equal(readFileSync(join(root, ".obsidian/plugins/pkm-html/data.json"), "utf8"), "{}");
	assert.ok(existsSync(join(root, ".obsidian/plugins/vault-html/memo.txt")));
});

test("0058: 読めない hotkeys.json は変えずに、check が失敗して止まる", async () => {
	const root = childFrom("fresh");
	write(root, { ".obsidian/hotkeys.json": "{壊れている" });
	const { failed } = await runMigrations(root);
	assert.equal(failed?.name, "0058-pkm-plugin-names");
	assert.match(failed.problems.join(), /JSON として読めない/);
	assert.equal(readFileSync(join(root, ".obsidian/hotkeys.json"), "utf8"), "{壊れている");
});

/** 0061 より前の移行（0061 だけを実行するときに、適用済みとして記録する） */
const before0061 = (root) => listMigrations(root).filter((m) => m < "0061");

test("0061: template/config.json を消し、捨てる値を知らせる。テンプレートの中身は残す", async () => {
	const root = childFrom("customized");
	const note = readFileSync(join(root, "template/file/note.md"), "utf8");
	const { done, failed } = await runMigrations(root);
	assert.equal(failed, null);
	assert.ok(!existsSync(join(root, "template/config.json")));
	assert.deepEqual(readdirSync(join(root, "template/file")).sort(), ["mine.md", "note.md"]);
	assert.equal(readFileSync(join(root, "template/file/note.md"), "utf8"), note);
	const changes = done.find((d) => d.name === "0061-fixed-template-config").changes.join("\n");
	assert.match(changes, /template\/config\.json: 消す/);
	assert.match(changes, /note\.md: folder = "memo"/);
	assert.match(changes, /mine\.md: .*folder = "mine"/);
});

test("0061: template/ に config.json しかなければ、template/ ごと消す", async () => {
	const root = childFrom("fresh");
	write(root, { "template/config.json": JSON.stringify({ templates: [{ file: "note.md", folder: "memo" }] }) });
	const record = JSON.parse(readFileSync(join(root, ".kit-local/upstream.json"), "utf8"));
	write(root, { ".kit-local/upstream.json": JSON.stringify({ ...record, migrations: before0061(root) }) });
	const { failed } = await runMigrations(root);
	assert.equal(failed, null);
	assert.ok(!existsSync(join(root, "template")));
});

test("0061: 読めない template/config.json は変えずに、check が失敗して止まる", async () => {
	const root = childFrom("fresh");
	// 0001 も同じファイルを読むので、0061 より前をすべて適用済みにして 0061 だけを実行する
	const record = JSON.parse(readFileSync(join(root, ".kit-local/upstream.json"), "utf8"));
	write(root, {
		".kit-local/upstream.json": JSON.stringify({ ...record, migrations: before0061(root) }),
		"template/config.json": "{壊れている",
	});
	const { failed } = await runMigrations(root);
	assert.equal(failed?.name, "0061-fixed-template-config");
	assert.match(failed.problems.join(), /JSON として読めない/);
	assert.equal(readFileSync(join(root, "template/config.json"), "utf8"), "{壊れている");
});

test("0064: community-plugins.json に pkm-drawio を足す（0102 が pkm-diagram に改名する）。ほかの要素と順は残し、2 回目は何も変えない", async () => {
	const root = childFrom("fresh");
	write(root, { ".obsidian/community-plugins.json": JSON.stringify(["pkm-git", "other", "pkm-ribbon", "pkm-html"], null, 2) });
	const { failed } = await runMigrations(root);
	assert.equal(failed, null);
	// 0070 が pkm-updates を、0072 が pkm-view-selector を、0120 が pkm-slide を、0128 が pkm-markdown を後ろに足す
	assert.deepEqual(readJsonFile(root, ".obsidian/community-plugins.json"), ["pkm-git", "other", "pkm-ribbon", "pkm-html", "pkm-diagram", "pkm-updates", "pkm-view-selector", "pkm-slide", "pkm-markdown"]);
	assert.deepEqual((await runMigrations(root)).done.flatMap((d) => d.changes), []);
	assert.ok(!readFileSync(join(root, ".obsidian/community-plugins.json"), "utf8").endsWith("\n"));
});

test("0064: 読めない community-plugins.json は変えずに、check が失敗して止まる", async () => {
	const root = childFrom("fresh");
	const record = JSON.parse(readFileSync(join(root, ".kit-local/upstream.json"), "utf8"));
	const all = readdirSync(join(here, ".kit/migrations")).filter((n) => n < "0064-drawio").sort();
	write(root, {
		".kit-local/upstream.json": JSON.stringify({ ...record, migrations: all }),
		".obsidian/community-plugins.json": "[壊れている",
	});
	const { failed } = await runMigrations(root);
	assert.equal(failed?.name, "0064-drawio");
	assert.match(failed.problems.join(), /JSON として読めない/);
	assert.equal(readFileSync(join(root, ".obsidian/community-plugins.json"), "utf8"), "[壊れている");
});

/** 0070 より前の移行（0070 だけを実行するときに、適用済みとして記録する） */
const before0070 = (root) => listMigrations(root).filter((m) => m < "0070");

test("0070: community-plugins.json に pkm-updates を足す。ほかの要素と順は残し、2 回目は何も変えない", async () => {
	const root = childFrom("fresh");
	const record = JSON.parse(readFileSync(join(root, ".kit-local/upstream.json"), "utf8"));
	write(root, {
		".kit-local/upstream.json": JSON.stringify({ ...record, migrations: before0070(root) }),
		".obsidian/community-plugins.json": JSON.stringify(["pkm-git", "other", "pkm-html"], null, 2),
	});
	const { failed, done } = await runMigrations(root);
	assert.equal(failed, null);
	// 0072 も後ろに pkm-view-selector を、0120 が pkm-slide を、0128 が pkm-markdown を足す。0089 は core-plugins.json だけを、0129 は theme.json だけを、0135 は issue/ だけを、0137 は issue/board-groups.json と routine/ だけを、0148 と 0152 は issue/ だけを見る（fresh では何も変えない）
	assert.deepEqual(done.map((d) => d.name), ["0070-pkm-updates", "0072-pkm-view-selector", "0089-file-recovery", "0102-pkm-diagram", "0120-pkm-slide", "0128-pkm-markdown", "0129-vault-theme-follow", "0135-sub-issues", "0137-board-lanes", "0148-inbox-clarified", "0152-calendar-tickler"]);
	assert.deepEqual(readJsonFile(root, ".obsidian/community-plugins.json"), ["pkm-git", "other", "pkm-html", "pkm-updates", "pkm-view-selector", "pkm-slide", "pkm-markdown"]);
	assert.ok(!readFileSync(join(root, ".obsidian/community-plugins.json"), "utf8").endsWith("\n"));
	const again = await runMigrations(root);
	assert.deepEqual(again.done.flatMap((d) => d.changes), []);
});

test("0070: 読めない community-plugins.json は変えずに、check が失敗して止まる", async () => {
	const root = childFrom("fresh");
	const record = JSON.parse(readFileSync(join(root, ".kit-local/upstream.json"), "utf8"));
	write(root, {
		".kit-local/upstream.json": JSON.stringify({ ...record, migrations: before0070(root) }),
		".obsidian/community-plugins.json": "[壊れている",
	});
	const { failed } = await runMigrations(root);
	assert.equal(failed?.name, "0070-pkm-updates");
	assert.match(failed.problems.join(), /JSON として読めない/);
	assert.equal(readFileSync(join(root, ".obsidian/community-plugins.json"), "utf8"), "[壊れている");
});

test("0072: pkm-view-selector を有効にし、hotkeys.json の editor:insert-link を [] で上書きする。ほかのキーは残し、2 回目は何も変えない", async () => {
	const root = childFrom("customized");
	const { failed } = await runMigrations(root);
	assert.equal(failed, null);
	assert.ok(readJsonFile(root, ".obsidian/community-plugins.json").includes("pkm-view-selector"));
	const hotkeys = readJsonFile(root, ".obsidian/hotkeys.json");
	// 子が割り当てていた Mod+Shift+L も上書きする（ADR-0072）
	assert.deepEqual(hotkeys["editor:insert-link"], []);
	assert.deepEqual(hotkeys["editor:toggle-bold"], [{ modifiers: ["Mod"], key: "B" }]);
	assert.deepEqual((await runMigrations(root)).done.flatMap((d) => d.changes), []);
	assert.ok(!readFileSync(join(root, ".obsidian/hotkeys.json"), "utf8").endsWith("\n"));
});

test("0072: hotkeys.json がなければ作る", async () => {
	const root = childFrom("legacy");
	assert.ok(!existsSync(join(root, ".obsidian/hotkeys.json")));
	const { failed } = await runMigrations(root);
	assert.equal(failed, null);
	assert.deepEqual(readJsonFile(root, ".obsidian/hotkeys.json"), { "editor:insert-link": [] });
});

test("0072: 読めない hotkeys.json は変えずに、check が失敗して止まる", async () => {
	const root = childFrom("fresh");
	const record = JSON.parse(readFileSync(join(root, ".kit-local/upstream.json"), "utf8"));
	const all = readdirSync(join(here, ".kit/migrations")).filter((n) => n < "0072-pkm-view-selector").sort();
	write(root, {
		".kit-local/upstream.json": JSON.stringify({ ...record, migrations: all }),
		".obsidian/hotkeys.json": "{壊れている",
	});
	const { failed } = await runMigrations(root);
	assert.equal(failed?.name, "0072-pkm-view-selector");
	assert.match(failed.problems.join(), /JSON として読めない/);
	assert.equal(readFileSync(join(root, ".obsidian/hotkeys.json"), "utf8"), "{壊れている");
});

test("0089: コアプラグインのファイル回復を有効にする。ほかの設定は残す", async () => {
	const root = childFrom("legacy");
	const core = { ...readJsonFile(root, ".obsidian/core-plugins.json"), "file-recovery": false };
	write(root, { ".obsidian/core-plugins.json": JSON.stringify(core, null, 2) });
	const { failed } = await runMigrations(root);
	assert.equal(failed, null);
	assert.deepEqual(readJsonFile(root, ".obsidian/core-plugins.json"), { ...core, "daily-notes": false, "file-recovery": true, "tag-pane": false });
});

test("0089: 読めない core-plugins.json は変えずに、check が失敗して止まる", async () => {
	const root = childFrom("legacy");
	// 0002 も同じファイルを読むので、0072 までを適用済みにして 0089 だけを実行する
	const record = JSON.parse(readFileSync(join(root, ".kit-local/upstream.json"), "utf8"));
	const before = listMigrations(root).filter((n) => n < "0089");
	write(root, {
		".kit-local/upstream.json": JSON.stringify({ ...record, migrations: before }),
		".obsidian/core-plugins.json": "{壊れている",
	});
	const { failed } = await runMigrations(root);
	assert.equal(failed?.name, "0089-file-recovery");
	assert.equal(readFileSync(join(root, ".obsidian/core-plugins.json"), "utf8"), "{壊れている");
});

test("0102: pkm-drawio を pkm-diagram に改名する（community-plugins・hotkeys・スニペットの command）。2 回目は何も変えない", async () => {
	const root = childFrom("fresh");
	write(root, {
		".obsidian/community-plugins.json": JSON.stringify(["pkm-git", "pkm-drawio", "other"], null, 2),
		".obsidian/hotkeys.json": JSON.stringify({ "pkm-drawio:create-diagram": [{ modifiers: ["Mod"], key: "J" }] }),
		"template/snippet/my-drawio.md": "---\nname: my-drawio\nalias: md\ncommand: pkm-drawio:create-diagram\n---\n本文の pkm-drawio:create-diagram は変えない\n",
	});
	const { failed } = await runMigrations(root);
	assert.equal(failed, null);
	const plugins = readJsonFile(root, ".obsidian/community-plugins.json");
	assert.ok(!plugins.includes("pkm-drawio"));
	assert.deepEqual(plugins.slice(0, 3), ["pkm-git", "pkm-diagram", "other"]);
	assert.deepEqual(readJsonFile(root, ".obsidian/hotkeys.json")["pkm-diagram:create-diagram"], [{ modifiers: ["Mod"], key: "J" }]);
	assert.equal(
		readFileSync(join(root, "template/snippet/my-drawio.md"), "utf8"),
		"---\nname: my-drawio\nalias: md\ncommand: pkm-diagram:create-diagram\n---\n本文の pkm-drawio:create-diagram は変えない\n",
	);
	assert.deepEqual((await runMigrations(root)).done.flatMap((d) => d.changes), []);
});

test("0102: 新旧の両方があれば新しい方を残し、この端末の data.json を写して古いフォルダを消す", async () => {
	const root = childFrom("fresh");
	write(root, {
		".obsidian/community-plugins.json": JSON.stringify(["pkm-drawio", "pkm-diagram"]),
		".obsidian/plugins/pkm-drawio/data.json": '{"a":1}',
	});
	const { failed } = await runMigrations(root);
	assert.equal(failed, null);
	assert.equal(readJsonFile(root, ".obsidian/community-plugins.json").filter((id) => id.startsWith("pkm-d")).join(), "pkm-diagram");
	assert.equal(readFileSync(join(root, ".obsidian/plugins/pkm-diagram/data.json"), "utf8"), '{"a":1}');
	assert.ok(!existsSync(join(root, ".obsidian/plugins/pkm-drawio")));
});

/** 0128 より前の移行（0128 だけを実行するときに、適用済みとして記録する） */
const before0128 = (root) => listMigrations(root).filter((m) => m < "0128");

test("0128: pkm-markdown を有効にし、コアプラグインのタグを無効にする。ほかの要素とキーは残し、2 回目は何も変えない", async () => {
	const root = childFrom("customized");
	const core = readJsonFile(root, ".obsidian/core-plugins.json");
	assert.equal(core["tag-pane"], true);
	const { failed } = await runMigrations(root);
	assert.equal(failed, null);
	assert.equal(readJsonFile(root, ".obsidian/community-plugins.json").at(-1), "pkm-markdown");
	assert.deepEqual(readJsonFile(root, ".obsidian/core-plugins.json"), { ...core, "daily-notes": false, "tag-pane": false });
	assert.deepEqual((await runMigrations(root)).done.flatMap((d) => d.changes), []);
	assert.ok(!readFileSync(join(root, ".obsidian/core-plugins.json"), "utf8").endsWith("\n"));
	assert.ok(!readFileSync(join(root, ".obsidian/community-plugins.json"), "utf8").endsWith("\n"));
});

test("0128: core-plugins.json がなければ作る", async () => {
	const root = childFrom("fresh");
	const record = JSON.parse(readFileSync(join(root, ".kit-local/upstream.json"), "utf8"));
	write(root, { ".kit-local/upstream.json": JSON.stringify({ ...record, migrations: before0128(root) }) });
	rmSync(join(root, ".obsidian/core-plugins.json"));
	const { failed } = await runMigrations(root);
	assert.equal(failed, null);
	assert.deepEqual(readJsonFile(root, ".obsidian/core-plugins.json"), { "tag-pane": false });
});

for (const [path, broken] of [
	[".obsidian/community-plugins.json", "[壊れている"],
	[".obsidian/core-plugins.json", "{壊れている"],
]) {
	test(`0128: 読めない ${path} は変えずに、check が失敗して止まる`, async () => {
		const root = childFrom("fresh");
		const record = JSON.parse(readFileSync(join(root, ".kit-local/upstream.json"), "utf8"));
		write(root, { ".kit-local/upstream.json": JSON.stringify({ ...record, migrations: before0128(root) }), [path]: broken });
		const { failed } = await runMigrations(root);
		assert.equal(failed?.name, "0128-pkm-markdown");
		assert.match(failed.problems.join(), /JSON として読めない/);
		assert.equal(readFileSync(join(root, path), "utf8"), broken);
	});
}

/** ADR-0121 の theme.mjs が作った、ライトの primary だけの子の基本の色（0129 の前の形） */
const THEME_0121 = {
	".kit-local/theme.json": JSON.stringify({ light: { primary: "#00639b" } }, null, 2),
	".obsidian/snippets/pkm-theme-local.css": [
		"/* 生成物。手で編集しない。正本は .kit-local/theme.json（node .kit/bin/theme.mjs build で作り直す） */",
		"/* 子の Vault の基本の色（.kit/src/docs/adr/0121-vault-theme.md）。上流の値から変わった色だけを書く */",
		"",
		"html body.theme-light {",
		"\t--vt-primary: #00639b;",
		"\t--interactive-accent: #00639b;",
		"\t--text-accent: #00639b;",
		"\t--color-accent: #00639b;",
		"\t--vt-primary-state-hover: #00639b14;",
		"}",
		"",
	].join("\n"),
	".obsidian/appearance.json": JSON.stringify({ accentColor: "#00639b", enabledCssSnippets: ["vault-theme", "my-snippet", "pkm-theme-local"] }, null, 2),
};

test("0129: theme.json がある Vault は、子のスニペットを作り直し、primary から作る色とダークの primary を足す。2 回目は何も変えない", async () => {
	const root = childFrom("customized");
	write(root, THEME_0121);
	const before = readFileSync(join(root, ".obsidian/snippets/pkm-theme-local.css"), "utf8");
	assert.ok(!before.includes("--vt-secondary-container"));
	const { failed } = await runMigrations(root);
	assert.equal(failed, null, JSON.stringify(failed));
	const css = readFileSync(join(root, ".obsidian/snippets/pkm-theme-local.css"), "utf8");
	assert.match(css, /html body\.theme-light \{[^}]*--vt-secondary-container: #[0-9a-f]{6};/);
	assert.match(css, /html body\.theme-dark \{[^}]*--vt-primary: #[0-9a-f]{6};/);
	assert.ok(!css.includes("#e8def8") && !css.includes("#381e72"));
	const appearance = readJsonFile(root, ".obsidian/appearance.json");
	assert.equal(appearance.accentColor, "#00639b");
	assert.ok(appearance.enabledCssSnippets.includes("pkm-theme-local") && appearance.enabledCssSnippets.includes("my-snippet"));
	assert.deepEqual((await runMigrations(root)).done.flatMap((d) => d.changes), []);
});

test("0129: theme.json が規約に合わなければ何も書かずに、check が失敗して止まる", async () => {
	const root = childFrom("customized");
	write(root, { ...THEME_0121, ".kit-local/theme.json": JSON.stringify({ light: { primary: "#d0bcff" } }) });
	const snippet = readFileSync(join(root, ".obsidian/snippets/pkm-theme-local.css"), "utf8");
	const { failed } = await runMigrations(root);
	assert.equal(failed?.name, "0129-vault-theme-follow");
	assert.equal(readFileSync(join(root, ".obsidian/snippets/pkm-theme-local.css"), "utf8"), snippet);
});

/** pkm-task の lint（ビルド済みの CLI）で、Vault の issue/ と worklog/ の問題を読む */
function taskLint(root) {
	const r = spawnSync(process.execPath, [join(here, ".kit/bin/lint.mjs"), root, "--json"], { encoding: "utf8" });
	return JSON.parse(r.stdout).problems.map((p) => `${p.path} ${p.code}`);
}

test("0135: 子と孫を、いちばん上の祖先のサブにして子のファイルを消し、related を合成キーにする。ほかの issue は変えない", async () => {
	const root = childFrom("legacy");
	write(root, {
		"worklog/pc/2026-01.jsonl": '{"id":"wl_1","task_id":"i-11","from":"2026-01-05T00:00:00Z","to":"2026-01-05T01:00:00Z","description":""}\n',
	});
	const other = readFileSync(join(root, "issue/i-2.md"), "utf8");
	const head = readFileSync(join(root, "issue/i-10.md"), "utf8");
	const { failed } = await runMigrations(root);
	assert.equal(failed, null, JSON.stringify(failed));
	assert.ok(!existsSync(join(root, "issue/i-11.md")));
	assert.ok(!existsSync(join(root, "issue/i-12.md")));
	assert.equal(readFileSync(join(root, "issue/i-2.md"), "utf8"), other);
	const parent = readFileSync(join(root, "issue/i-10.md"), "utf8");
	assert.ok(parent.startsWith(head.trimEnd()), "親の本文は変えない");
	const blocks = parent.split("<!-- sub-issue").slice(1);
	assert.equal(blocks.length, 2);
	// 子の scheduled（過去の日付）は、後の 0152 が消す
	assert.match(blocks[0], /\nsummary: "子: 仕様を決める"\nstatus: closed\nestimated: 120\ncreated: 2026-01-03T09:00:00\+09:00\nmigrated_from: i-11\n-->\n（移行で残した項目）priority: high \/ label: \[仕事, 調査\] \/ related: \[i-2\]\n\n## ToDo\n\n- \[x\] 下調べ\n/);
	assert.match(blocks[1], /\nsummary: "孫の issue"\nstatus: open\ndeadline: 2026-01-20\ncreated: 2026-01-04T09:00:00\+09:00\nmigrated_from: i-12\n-->\n$/);
	const subId = /^\nid: ([a-z0-9]{6})\n/.exec(blocks[0])[1];
	assert.match(readFileSync(join(root, "issue/i-13.md"), "utf8"), new RegExp(`^related: \\["i-10#${subId}","daily/2026/01/2026-01-01.md"\\]$`, "m"));
	// pkm-task で読むと、サブになり、旧 ID の worklog はそのサブの記録になる（lint の問題がない）
	assert.deepEqual(taskLint(root).filter((p) => p.startsWith("issue/") || p.startsWith("worklog/")), []);
});

test("0135: --dry-run は書かずに、変換する子と残す値を一覧にする", () => {
	const root = childFrom("legacy");
	const before = snapshot(root);
	const dry = node(root, "--dry-run");
	assert.equal(dry.status, 0, dry.stderr);
	assert.match(dry.stdout, /issue\/i-11\.md: i-10 のサブ [a-z0-9]{6}（i-10#[a-z0-9]{6}）にして、ファイルを消す。写さない項目を本文の先頭に残す: priority: high/);
	assert.deepEqual(snapshot(root), before);
});

test("0135: ない親・循環・読めない parent は変えずに、check が失敗して止まる", async () => {
	for (const [files, pattern] of [
		[{ "issue/i-20.md": "---\ntype: issue\nid: i-20\nsummary: x\nstatus: open\nparent: i-99\n---\n" }, /issue\/i-20\.md: parent の i-99 がない/],
		[
			{
				"issue/i-20.md": "---\ntype: issue\nid: i-20\nsummary: x\nstatus: open\nparent: i-21\n---\n",
				"issue/i-21.md": "---\ntype: issue\nid: i-21\nsummary: y\nstatus: open\nparent: i-20\n---\n",
			},
			/循環/,
		],
		[{ "issue/i-20.md": "---\ntype: issue\nid: i-20\nsummary: x\nstatus: open\nparent:\n  id: i-1\n---\n" }, /parent が読めない/],
		[{ "issue/i-20.md": "---\ntype: issue\nid: i-20\nsummary: x\nstatus: open\nparent: i-1\n---\n\n<!-- sub-issue\n" }, /本文の行頭に <!-- sub-issue/],
	]) {
		const root = childFrom("legacy");
		write(root, files);
		const { failed } = await runMigrations(root);
		assert.equal(failed?.name, "0135-sub-issues");
		assert.match(failed.problems.join("\n"), pattern);
		for (const [path, text] of Object.entries(files)) assert.equal(readFileSync(join(root, path), "utf8"), text);
	}
});

test("0135: CRLF の親にも、行末をそろえて足す", async () => {
	const root = childFrom("fresh");
	write(root, {
		"issue/i-1.md": "---\r\ntype: issue\r\nid: i-1\r\nsummary: 親\r\nstatus: open\r\n---\r\n\r\n本文\r\n",
		"issue/i-2.md": "---\ntype: issue\nid: i-2\nsummary: 子\nstatus: open\nparent: i-1\n---\n",
	});
	await runMigrations(root);
	const text = readFileSync(join(root, "issue/i-1.md"), "utf8");
	assert.match(text, /^---\r\ntype: issue\r\nid: i-1\r\nsummary: 親\r\nstatus: open\r\n---\r\n\r\n本文\r\n\r\n<!-- sub-issue\r\nid: [a-z0-9]{6}\r\nsummary: "子"\r\nstatus: open\r\nmigrated_from: i-2\r\n-->\r\n$/);
});

test("0135: 親に足し終えて子を消す前に止まっていたら、足し直さずに子を消す", async () => {
	const root = childFrom("fresh");
	write(root, {
		"issue/i-1.md": "---\ntype: issue\nid: i-1\nsummary: 親\nstatus: open\n---\n\n<!-- sub-issue\nid: abc123\nsummary: \"子\"\nstatus: open\nmigrated_from: i-2\n-->\n",
		"issue/i-2.md": "---\ntype: issue\nid: i-2\nsummary: 子\nstatus: open\nparent: i-1\n---\n",
		"issue/i-3.md": "---\ntype: issue\nid: i-3\nsummary: 参照\nstatus: open\nrelated: [i-2]\n---\n",
	});
	const before = readFileSync(join(root, "issue/i-1.md"), "utf8");
	await runMigrations(root);
	assert.equal(readFileSync(join(root, "issue/i-1.md"), "utf8"), before);
	assert.ok(!existsSync(join(root, "issue/i-2.md")));
	assert.match(readFileSync(join(root, "issue/i-3.md"), "utf8"), /^related: \["i-1#abc123"\]$/m);
});

test("0137: board-groups.json を消し、routine と routine のテンプレートの group の行だけを消す。ほかの routine と board の jsonl は変えない", async () => {
	const root = childFrom("legacy");
	write(root, {
		"routine/r-2.md": "---\r\ntype: routine\r\nid: r-2\r\nsummary: 週次\r\nrepeat: {\"every\": \"week\", \"on\": [\"fri\"]}\r\nstart: 2026-01-01\r\ngroup: \"午後\"\r\n---\r\n本文\r\n",
		"routine/r-3.md": "---\ntype: routine\nid: r-3\nsummary: 群れ\nrepeat: {\"every\": \"day\"}\nstart: 2026-01-01\n---\n\ngroup: 本文の group は変えない\n",
		"template/file/routine.md": "---\ntype: routine\nid: \"{{id:r}}\"\ngroup: 午前\nsummary: \"{{title}}\"\n---\n",
		"board/pc/2026-01.jsonl": '{"id":"bo_1","at":"2026-01-05T00:00:00.000Z","date":"2026-01-05","op":"place","task":"r-1","group":"午前"}\n',
	});
	const r3 = readFileSync(join(root, "routine/r-3.md"), "utf8");
	const log = readFileSync(join(root, "board/pc/2026-01.jsonl"), "utf8");
	const { failed } = await runMigrations(root);
	assert.equal(failed, null, JSON.stringify(failed));
	assert.ok(!existsSync(join(root, "issue/board-groups.json")));
	assert.equal(readFileSync(join(root, "routine/r-1.md"), "utf8"), "---\nschema: 1\ntype: routine\nid: r-1\nsummary: 朝のメール確認\nrepeat: {\"every\": \"day\"}\nstart: 2026-01-01\nactive: true\nestimated: 15\ncreated: 2026-01-01T09:00:00+09:00\nupdated: 2026-01-01T09:00:00+09:00\n---\n\n## 手順\n\n- [ ] 受信箱を空にする\n");
	assert.equal(readFileSync(join(root, "routine/r-2.md"), "utf8"), "---\r\ntype: routine\r\nid: r-2\r\nsummary: 週次\r\nrepeat: {\"every\": \"week\", \"on\": [\"fri\"]}\r\nstart: 2026-01-01\r\n---\r\n本文\r\n");
	assert.equal(readFileSync(join(root, "routine/r-3.md"), "utf8"), r3);
	assert.equal(readFileSync(join(root, "template/file/routine.md"), "utf8"), "---\ntype: routine\nid: \"{{id:r}}\"\nsummary: \"{{title}}\"\n---\n");
	assert.equal(readFileSync(join(root, "board/pc/2026-01.jsonl"), "utf8"), log);
	// pkm-task で読むと、routine の group の警告も、board の jsonl の問題もない
	assert.deepEqual(taskLint(root).filter((p) => p.startsWith("routine/") || p.startsWith("board/")), []);
});

test("0137: --dry-run は書かずに、消すファイルと行を一覧にする", () => {
	const root = childFrom("legacy");
	const before = snapshot(root);
	const dry = node(root, "--dry-run");
	assert.equal(dry.status, 0, dry.stderr);
	assert.match(dry.stdout, /issue\/board-groups\.json: グループを廃止したので消す/);
	assert.match(dry.stdout, /routine\/r-1\.md: frontmatter の group を消す/);
	assert.deepEqual(snapshot(root), before);
});

test("0137: group が 1 行の値でない routine は変えずに、check が失敗して止まる", async () => {
	const root = childFrom("legacy");
	const files = { "routine/r-2.md": "---\ntype: routine\nid: r-2\nsummary: x\ngroup:\n  name: 午前\n---\n" };
	write(root, files);
	const { failed } = await runMigrations(root);
	assert.equal(failed?.name, "0137-board-lanes");
	assert.match(failed.problems.join("\n"), /routine\/r-2\.md: group が 1 行の値ではなく/);
	assert.equal(readFileSync(join(root, "routine/r-2.md"), "utf8"), files["routine/r-2.md"]);
});


test("0148: 日付がある open の issue に clarified: true を足す。日付のない issue・open でない issue・clarified のある issue は変えない", async () => {
	const root = childFrom("legacy");
	write(root, {
		"issue/i-20.md": "---\r\ntype: issue\r\nid: i-20\r\nsummary: 期限だけ\r\nstatus: \"open\"\r\nsoft_deadline: 2026-02-01\r\n---\r\n本文\r\n",
		"issue/i-21.md": "---\ntype: issue\nid: i-21\nsummary: 空の日付\nstatus: open\nscheduled: []\ndeadline: null\n---\n",
		"issue/i-22.md": "---\ntype: issue\nid: i-22\nsummary: 決めてある\nstatus: open\nclarified: false\ndeadline: 2026-02-01\n---\n",
		"issue/i-23.md": "---\ntype: issue\nid: i-23\nsummary: 待ち\nstatus: waiting\ndeadline: 2026-02-01\n---\n",
		"issue/i-24.md": "---\ntype: issue\nid: i-24\nsummary: 本文の日付\nstatus: open\n---\n\ndeadline: 2026-02-01\n",
	});
	const untouched = ["issue/i-2.md", "issue/i-22.md", "issue/i-23.md", "issue/i-24.md"].map((p) => [p, readFileSync(join(root, p), "utf8")]);
	const { failed } = await runMigrations(root);
	assert.equal(failed, null, JSON.stringify(failed));
	assert.match(readFileSync(join(root, "issue/i-1.md"), "utf8"), /^clarified: true\n---\n/m);
	// i-14 の過去の scheduled は、後の 0152 が消す（Calendar の日は移行した日以降だけ残す）
	assert.match(readFileSync(join(root, "issue/i-14.md"), "utf8"), /^clarified: true\n---\n$/m);
	assert.equal(readFileSync(join(root, "issue/i-20.md"), "utf8"), "---\r\ntype: issue\r\nid: i-20\r\nsummary: 期限だけ\r\nstatus: \"open\"\r\nsoft_deadline: 2026-02-01\r\nclarified: true\r\n---\r\n本文\r\n");
	for (const [p, text] of untouched) assert.equal(readFileSync(join(root, p), "utf8"), text, p);
	// 空の日付には clarified を足さない（空のリストの scheduled は、後の 0152 が消す）
	assert.equal(readFileSync(join(root, "issue/i-21.md"), "utf8"), "---\ntype: issue\nid: i-21\nsummary: 空の日付\nstatus: open\ndeadline: null\n---\n");
	// pkm-task で読むと、日付のある issue は Inbox から外れ、日付のない issue は Inbox に残る
	assert.deepEqual(taskLint(root).filter((p) => p.startsWith("issue/i-")), []);
	const again = await runMigrations(root);
	assert.deepEqual(again.done.flatMap((d) => d.changes), []);
});

test("0148: --dry-run は書かずに、clarified を足す issue を一覧にする", () => {
	const root = childFrom("legacy");
	const before = snapshot(root);
	const dry = node(root, "--dry-run");
	assert.equal(dry.status, 0, dry.stderr);
	assert.match(dry.stdout, /issue\/i-14\.md: 日付があるので整理済み（clarified: true）にする/);
	assert.doesNotMatch(dry.stdout, /issue\/i-2\.md: 日付があるので/);
	assert.deepEqual(snapshot(root), before);
});

test("0152: issue と サブの scheduled のリストを、移行した日以降の最も早い日 1 つにする。過去だけなら消す。日付 1 つは変えない", async () => {
	const root = childFrom("legacy");
	write(root, {
		"issue/i-30.md": "---\r\ntype: issue\r\nid: i-30\r\nsummary: 先と過去\r\nstatus: open\r\nscheduled: [2000-01-01, \"2099-03-05\", 2099-01-02]\r\n---\r\n本文\r\n",
		"issue/i-31.md": "---\ntype: issue\nid: i-31\nsummary: 日付 1 つ\nstatus: open\nscheduled: 2099-01-02\n---\n",
		"issue/i-32.md": "---\ntype: issue\nid: i-32\nsummary: 親\nstatus: open\nscheduled:\n  - 2000-01-01\n---\n\nscheduled: [2000-01-01] は本文なので変えない\n\n<!-- sub-issue\nid: aaaaaa\nsummary: \"先\"\nstatus: open\nscheduled: [\"2099-02-01\", \"2099-01-15\"]\n-->\n本文\n\n<!-- sub-issue\nid: bbbbbb\nsummary: \"過去\"\nstatus: open\nscheduled: [\"2000-01-01\"]\nestimated: 30\n-->\n",
	});
	const i31 = readFileSync(join(root, "issue/i-31.md"), "utf8");
	const { failed } = await runMigrations(root);
	assert.equal(failed, null, JSON.stringify(failed));
	assert.equal(readFileSync(join(root, "issue/i-30.md"), "utf8"), "---\r\ntype: issue\r\nid: i-30\r\nsummary: 先と過去\r\nstatus: open\r\nscheduled: 2099-01-02\r\nclarified: true\r\n---\r\n本文\r\n");
	// 日付 1 つの scheduled は変えない（clarified は 0148 が足す）
	assert.equal(readFileSync(join(root, "issue/i-31.md"), "utf8"), i31.replace("scheduled: 2099-01-02\n", "scheduled: 2099-01-02\nclarified: true\n"));
	assert.equal(
		readFileSync(join(root, "issue/i-32.md"), "utf8"),
		"---\ntype: issue\nid: i-32\nsummary: 親\nstatus: open\nclarified: true\n---\n\nscheduled: [2000-01-01] は本文なので変えない\n\n<!-- sub-issue\nid: aaaaaa\nsummary: \"先\"\nstatus: open\nscheduled: 2099-01-15\n-->\n本文\n\n<!-- sub-issue\nid: bbbbbb\nsummary: \"過去\"\nstatus: open\nestimated: 30\n-->\n",
	);
	// pkm-task で読むと、リストの scheduled の警告が出ない
	assert.deepEqual(taskLint(root).filter((p) => p.includes("legacy-scheduled-list")), []);
	const again = await runMigrations(root);
	assert.deepEqual(again.done.flatMap((d) => d.changes), []);
});

test("0152: 日付でない値のあるリストは変えずに、check が失敗して止まる", async () => {
	const root = childFrom("legacy");
	const files = { "issue/i-30.md": "---\ntype: issue\nid: i-30\nsummary: x\nstatus: closed\nscheduled: [あした]\n---\n" };
	write(root, files);
	const { failed } = await runMigrations(root);
	assert.equal(failed?.name, "0152-calendar-tickler");
	assert.match(failed.problems.join("\n"), /issue\/i-30\.md: scheduled のリストに日付でない値があり/);
	assert.equal(readFileSync(join(root, "issue/i-30.md"), "utf8"), files["issue/i-30.md"]);
});
