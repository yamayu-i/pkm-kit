import assert from "node:assert/strict";
import { test } from "node:test";
import { collectReports, latestCheck, parseReport, statusMessage } from "../../../.kit/harness/hooks/security-check-status.mjs";
import { commit, git, tempRepo, write } from "./helpers.mjs";

const report = (commitId, result) => `# セキュリティチェック\n\n- 対象 commit: ${commitId}\n- 前回: 初回\n- 結果: ${result}\n`;
const R = ".kit/harness/security/reports";

test("レポートの名前から日付を、本文の最後のチェックから commit と結果を読む", () => {
	const text = `${report("abc1234", "fail")}\n${report("5041633（1245fc7 に main を merge したもの）", "pass")}`;
	assert.deepEqual(parseReport("2026-11-08-html-viewer.md", text), {
		date: "2026-11-08",
		report: "2026-11-08-html-viewer.md",
		commit: "5041633",
		result: "pass",
	});
	assert.equal(parseReport("README.md", text), null);
});

test("最新の日付を選び、同じ日に pass があればそれを選ぶ", () => {
	const r = (report, result) => ({ date: report.slice(0, 10), report, commit: "aaaaaaa", result });
	assert.equal(latestCheck([r("2026-11-01.md", "pass"), r("2026-11-08-b.md", "pass"), r("2026-11-08-a.md", "fail")]).report, "2026-11-08-b.md");
	assert.equal(latestCheck([r("2026-11-01.md", "pass"), r("2026-11-08.md", "partial")]).result, "partial");
	assert.equal(latestCheck([]), null);
});

test("期限の判定: 記録なし、7 日以上、pass でない、期限内", () => {
	const last = { date: "2026-11-01", report: "2026-11-01.md", commit: "abc1234", result: "pass" };
	assert.match(statusMessage(null), /記録がありません/);
	assert.match(statusMessage(last, new Date("2026-11-08T12:00:00")), /期限切れ（前回から 7 日経過/);
	assert.match(statusMessage({ ...last, result: "partial" }, new Date("2026-11-02T12:00:00")), /期限切れ（前回の結果が partial/);
	assert.match(statusMessage(last, new Date("2026-11-03T12:00:00")), /OK（前回 2026-11-01、commit abc1234.*次回期限まで 5 日/);
});

test("別のブランチで main にマージされたレポートも、origin/main から数える", () => {
	const root = tempRepo({ [`${R}/2026-11-01.md`]: report("1111111", "pass") });
	commit(root, "main のチェック", { [`${R}/2026-11-08-other.md`]: report("2222222", "pass") });
	git(root, "update-ref", "refs/remotes/origin/main", "HEAD");
	git(root, "checkout", "-q", "-b", "work", "HEAD~1");
	write(root, { [`${R}/2026-11-05-mine.md`]: report("3333333", "pass") });
	const last = latestCheck(collectReports(root));
	assert.equal(last.report, "2026-11-08-other.md");
	assert.equal(last.commit, "2222222");
});
