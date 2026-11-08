import assert from "node:assert/strict";
import { test } from "node:test";
import { commitKind, usageReport } from "../usage-report.mjs";
import { commit, page, tempRepo } from "./helpers.mjs";

test("コミットの件名を種類に分ける", () => {
	assert.equal(commitKind("vault: snapshot (iphone)"), "snapshot（iphone）");
	assert.equal(commitKind("wiki(ingest): 記事を取り込む"), "wiki(ingest)");
	assert.equal(commitKind("feat(vault-task): 一覧を追加する"), "feat");
	assert.equal(commitKind("Merge pull request #3 from x"), "マージ");
	assert.equal(commitKind("適当なメッセージ"), "その他");
});

test("利用実態を集計する", () => {
	const root = tempRepo({ "memo.md": "a" });
	commit(root, "vault: snapshot (iphone)", { "memo.md": "b", "wiki/feedback.md": "# フィードバック\n" });
	commit(root, "wiki(ingest): 取り込む", {
		"wiki/index.md": "[a](wiki/a.md) [b](wiki/b.md)",
		"wiki/a.md": page({ updated: "2026-01-01" }) + "[b](wiki/b.md)\n",
		"wiki/b.md": page({ type: "topic" }),
		"wiki/log.md": "## 2026-10-30 ingest | x\n",
		"wiki/feedback.md": "# フィードバック\n検索で見つからない\n",
	});
	const report = usageReport(root, "2000-01-01", "2026-10-31");
	assert.match(report, /- snapshot（iphone）: 1/);
	assert.match(report, /- wiki\(ingest\): 1/);
	assert.match(report, /- memo\.md: 2 回（human）/);
	assert.match(report, /ページ数: 2（concept 1、topic 1）/);
	assert.match(report, /参照されていない（index と log を除く）: wiki\/a\.md/);
	assert.match(report, /更新されていない: wiki\/a\.md/);
	assert.match(report, /- ingest: 1/);
	assert.match(report, /> 検索で見つからない/);
	assert.match(report, /## 出力の記録（output-log）[\s\S]*### 段階ごと/);
});
