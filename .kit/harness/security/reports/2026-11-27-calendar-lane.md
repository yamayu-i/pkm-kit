# セキュリティチェック 2026-11-27

- 対象 commit: d3b88cf
- 前回: 2026-11-27 / 0200d78
- 結果: pass

## 機械的チェック

`pnpm security:scan`: 8/8 passed（秘密情報・data.json・危険な API・依存の固定・lockfile・ビルドの再現性・require・pnpm audit）。`pnpm check`: 型チェック・ビルド・テストすべて成功。

## 目視レビュー

対象は ADR-0255 の変更（pkm-task の `src/obsidian/writer.ts`・`sub-editor.tsx`、`cli/vault-ops.ts`、core・header・views）。

- 認証情報: 触れていない。問題なし
- 通信: 触れていない。問題なし
- ファイル書き込み: 書き込みの経路は増えていない。`assertSubPeriod`・`assertSubPeriodOnDisk` に検査（Calendar と期間の両方を止める）を足しただけで、書く先・書き方は従来の `updateSub`・`updateSubIssueOnDisk` のまま。問題なし
- データ消失: 両方を持つ既存のサブは変えない（移行 0255 は報告だけ）。ガントの切り替えは 1 回の書き込み。問題なし
- UI: HTML 文字列を DOM に入れていない（Preact の JSX と Obsidian の Menu だけ）。問題なし
- サプライチェーン: 依存・lockfile の変更なし

## 依存

変更なし。

## 対応したこと / 残課題

なし
