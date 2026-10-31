import assert from "node:assert/strict";
import { test } from "node:test";
import { checkDocs } from "../check-docs.mjs";
import { tempVault } from "./helpers.mjs";

test("CLAUDE.md から辿れる文書とスキルは通る", () => {
	const dir = tempVault({
		"CLAUDE.md": "@docs/a.md\n[スキル](skills/s/SKILL.md)\n",
		"docs/a.md": "[b](b.md#見出し)\n",
		"docs/b.md": "",
		"skills/s/SKILL.md": "---\nname: s\ndescription: 説明\n---\n[a](../../docs/a.md)\n",
		"notes/2026-10-31-x.md": "辿れなくてよい",
	});
	assert.deepEqual(checkDocs(dir), { errors: [], warnings: [] });
});

test("リンク切れ、辿れない文書、行数、スキルの frontmatter を検査する", () => {
	const dir = tempVault({
		"CLAUDE.md": `${"x\n".repeat(100)}[x](docs/none.md)\n@docs/gone.md\n`,
		"docs/orphan.md": "",
		"skills/s/SKILL.md": "---\nname: other\n---\n",
	});
	const { errors } = checkDocs(dir);
	assert.ok(errors.some((e) => e.startsWith("CLAUDE.md: 103 行")));
	assert.ok(errors.includes("CLAUDE.md:101: リンク切れ: docs/none.md"));
	assert.ok(errors.includes("CLAUDE.md:102: @import の参照先がない: docs/gone.md"));
	assert.ok(errors.includes("docs/orphan.md: CLAUDE.md からリンクを辿って到達できない"));
	assert.ok(errors.includes("skills/s/SKILL.md: frontmatter の name を s にする"));
	assert.ok(errors.includes("skills/s/SKILL.md: frontmatter に description がない"));
});
