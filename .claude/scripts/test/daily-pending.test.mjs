import assert from "node:assert/strict";
import { test } from "node:test";
import { lastDailyRun, pendingDaily } from "../daily-pending.mjs";
import { commit, tempRepo } from "./helpers.mjs";

const d = (day) => `daily/2026/10/2026-10-${day}.md`;

test("log.md の最後の daily の記録を読む", () => {
	const log = "## 2026-10-01 daily | x\n- コミット: aaaaaaa\n## 2026-10-05 ingest | y\n- コミット: bbbbbbb\n## 2026-10-03 daily | z\n- コミット: ccccccc\n";
	assert.deepEqual(lastDailyRun(log), { date: "2026-10-03", commit: "ccccccc" });
	assert.equal(lastDailyRun("## 2026-10-05 ingest | y\n"), null);
});

test("記録がなければ今日より前のものをすべて返す", () => {
	const root = tempRepo({ [d("29")]: "a", [d("30")]: "b", [d("31")]: "今日" });
	assert.deepEqual(
		pendingDaily(root, "2026-10-31").pending.map((p) => p.path),
		[d("29"), d("30")],
	);
});

test("前回の処理の後の日付と、前回の後に追記されたものを返す", () => {
	const root = tempRepo({ [d("28")]: "a", [d("29")]: "b", [d("30")]: "c" });
	const sha = commit(root, "x");
	commit(root, "wiki(daily): 反映", {
		"wiki/log.md": `## 2026-10-30 daily | 10/28〜10/29\n- コミット: ${sha}\n`,
	});
	commit(root, "vault: snapshot (pc)", { [d("28")]: "a\n追記", [d("31")]: "d" });
	const { pending, last } = pendingDaily(root, "2026-11-01");
	assert.equal(last.commit, sha);
	assert.deepEqual(
		pending.map((p) => [p.path, p.reason]),
		[
			[d("28"), `前回（${sha}）の後に変更された`],
			[d("30"), "前回の処理の後の日付"],
			[d("31"), "前回の処理の後の日付"],
		],
	);
});
