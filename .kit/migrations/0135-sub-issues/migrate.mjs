/**
 * 0135: issue の親子関係（parent）を廃止し、子の issue を、いちばん上の祖先の md の中のサブイシューにする
 * （.kit/src/docs/adr/0135-sub-issues-in-issue-file.md）。
 * - 子（と孫）を、祖先の md の末尾にサブとして足し、子のファイルを消す。写さない項目は、サブの本文の先頭に 1 行で残す
 * - ほかの issue の related にある子の ID を、合成キー（i-12#k3f9a2）にする
 * - worklog・statuslog・board の jsonl は書き換えない（pkm-task が migrated_from から読む）
 * 何度実行しても同じ結果になる。扱えないもの（読めない frontmatter、ない親、循環、書けない値）は変えない（check が失敗して止まる）
 */
import { rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { appendBlocks, plan, read, rewriteRelated } from "./common.mjs";

export function migrate(root, { dryRun = false } = {}) {
	const { moves, related } = plan(root);
	const changes = [];
	const byTop = new Map();
	for (const m of moves) byTop.set(m.top.path, [...(byTop.get(m.top.path) ?? []), m]);
	for (const [path, list] of byTop) {
		const blocks = list.filter((m) => m.block !== null);
		if (blocks.length > 0 && !dryRun) writeFileSync(join(root, path), appendBlocks(read(root, path), blocks.map((m) => m.block), list[0].top.fm.eol));
		for (const m of list) {
			const kept = m.kept.length > 0 ? `。写さない項目を本文の先頭に残す: ${m.kept.join(" / ")}` : "";
			changes.push(m.block === null ? `${m.child.path}: ${m.top.id} のサブ ${m.subId} に足してあるので、ファイルを消す` : `${m.child.path}: ${m.top.id} のサブ ${m.subId}（${m.top.id}#${m.subId}）にして、ファイルを消す${kept}`);
		}
	}
	for (const m of moves) if (!dryRun) rmSync(join(root, m.child.path));
	for (const r of related) {
		if (!dryRun) writeFileSync(join(root, r.issue.path), rewriteRelated(r.issue, r.to));
		changes.push(`${r.issue.path}: related を ${JSON.stringify(r.from)} から ${JSON.stringify(r.to)} にする`);
	}
	return changes;
}
