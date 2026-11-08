import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { indexDir } from "../adr-index.mjs";
import { tempVault } from "./helpers.mjs";

const README = "# ADR\n\n## 一覧\n\n<!-- adr-index:start -->\n<!-- adr-index:end -->\n";
const adr = (n, title, status = "承認") => `# ADR-${n}: ${title}\n\n- 状態: ${status}\n- 日付: 2026-11-08\n`;

test("--write で見出しと状態の行から一覧を作り、作った後の検査は通る", () => {
	const dir = tempVault({
		"README.md": README,
		"0001-a.md": adr("0001", "A を決める", "承認（一部置換: 0056）"),
		"0056-b.md": adr("0056", "B | C を決める"),
		"template.md": adr("NNNN", "タイトル", "提案"),
	});
	assert.deepEqual(indexDir(dir, { write: true }), []);
	const text = readFileSync(join(dir, "README.md"), "utf8");
	assert.ok(
		text.includes(
			[
				"<!-- adr-index:start -->",
				"| ADR | 状態 | 内容 |",
				"|---|---|---|",
				"| [0001](0001-a.md) | 承認（一部置換: 0056） | A を決める |",
				"| [0056](0056-b.md) | 承認 | B \\| C を決める |",
				"<!-- adr-index:end -->",
			].join("\n"),
		),
	);
	assert.deepEqual(indexDir(dir), []);
});

test("一覧が ADR と合っていないと失敗し、書き換えない", () => {
	const dir = tempVault({ "README.md": README, "0001-a.md": adr("0001", "A") });
	const errors = indexDir(dir);
	assert.equal(errors.length, 1);
	assert.match(errors[0], /一覧が ADR と合っていない/);
	assert.equal(readFileSync(join(dir, "README.md"), "utf8"), README);
});

test("union の merge で行が重なって並びが崩れても、--write で整う", () => {
	const dir = tempVault({
		"README.md": `${README.replace("<!-- adr-index:end -->", "| 古い行 |\n| 古い行 |\n<!-- adr-index:end -->")}`,
		"0002-b.md": adr("0002", "B"),
		"0001-a.md": adr("0001", "A"),
	});
	assert.deepEqual(indexDir(dir, { write: true }), []);
	const text = readFileSync(join(dir, "README.md"), "utf8");
	assert.ok(!text.includes("古い行"));
	assert.ok(text.indexOf("0001-a.md") < text.indexOf("0002-b.md"));
});

test("見出し・状態の行がない、番号が重なる、印がない", () => {
	const dir = tempVault({
		"README.md": "# ADR\n",
		"0001-a.md": "# A\n",
		"0002-b.md": adr("0003", "B"),
		"0002-c.md": adr("0002", "C"),
	});
	const errors = indexDir(dir);
	assert.ok(errors.includes("0001-a.md: 1 行目を「# ADR-0001: タイトル」にする"));
	assert.ok(errors.includes("0001-a.md: 「- 状態:」の行がない"));
	assert.ok(errors.includes("0002-b.md: 見出しの番号（0003）がファイル名と違う"));
	assert.ok(errors.some((e) => /0002-c\.md: 番号 0002 が 0002-b\.md と重なっている/.test(e)));
	assert.ok(errors.some((e) => /一覧の印/.test(e)));
});

test("リポジトリの ADR の一覧は ADR と合っている", () => {
	for (const d of [".kit/harness/docs/adr", ".kit/src/docs/adr"]) {
		assert.deepEqual(indexDir(new URL(`../../../${d}`, import.meta.url).pathname), []);
	}
});
