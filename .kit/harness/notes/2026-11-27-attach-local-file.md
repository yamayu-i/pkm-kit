# 2026-11-27 @file と /file（ADR-0249）

## つまずき

- 起きたこと: `src/obsidian/` を変えたのに、コミットの前に security-check を実行せずにコミット・push した。ユーザーへの報告で気づき、後から実施した。後からのチェックで、点だけのファイル名（`..`）が `asset/.` を指す問題が見つかり、直した
- 改善案: dev-implement の「3. 検査を通す」で、セキュリティチェックが要る変更かどうかを、コミットの前に `git diff --name-only` と実施ルールのパスで機械的に判定して知らせる（フックか verify.mjs）

## 食い違い

- 起きたこと: 同じ日に 2 つ目のレポート（`2026-11-27-attach-local-file.md`）を置いても、`security-check-status.mjs` は前のレポート（`2026-11-27-sub-bulk-and-period.md`、commit 0200d78）を前回として表示した。`latestCheck` が同じ日付のレポートを名前の順に並べ、最後の pass を選ぶため。名前の順は実施の順ではない
- 改善案: 同じ日付のときは、対象 commit が他方の子孫であるもの（`git merge-base --is-ancestor`）か、レポートのコミット日時で新しいほうを選ぶ
