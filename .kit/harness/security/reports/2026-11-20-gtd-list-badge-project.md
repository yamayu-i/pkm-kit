# セキュリティチェック 2026-11-20

- 対象 commit: 8fac46a
- 前回: 2026-11-17 6ad4edc（2026-11-17-sub-depends-menu）
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 passed（pnpm audit を含む）
- `pnpm check`（`verify.mjs --plugin`）: 型チェック・ビルド・テストすべて成功（pkm-task 757 件ほか）
- `pnpm preview:ui`: 検査に問題なし

## 目視レビュー

前回の記録の commit から main に入った変更は、それぞれのブランチの報告で確認済み。ここではこのブランチの差分（ADR-0210。GTD の分類のバッジ、Project のサブの期間と Tickler の規則、someday の確認）を見た。`src/obsidian/` の変更は次のとおり。

- `writer.ts`: 書く前の検査を足した（Project の Tickler の上限、サブの期間の規則）。someday にしたとき、同じ issue の md の中の閉じていないサブの期間と Calendar の日を消す（`clearSubPeriods`。既存の `vault.process` と `updateSubIssueText` で、その issue のファイルだけを書く）
- `someday-confirm.tsx`（新規）: 確認のダイアログ。preact で描く。Cancel・閉じたら何も書かない
- `status-change.tsx`・`issue-actions.tsx`: someday の前に確認を挟む。`sub-editor.tsx`・`sub-card.tsx`: 期間の欄を押せなくし、日付の選択に検査を渡す
- 認証情報・通信: 対象外。追加なし。問題なし
- ファイル書き込み: 新しい書き込み先はない。someday のときに書くのは、その issue 自身のファイル（索引のパス）だけ。MCP（`cli/vault-ops.ts`）も既存の `readTextOrEmpty`・`writeTextInVault`（Vault の中のパスの検査を通る）で、その issue のファイルだけを書く。問題なし
- データ消失: someday でサブの期間を消すのは、画面では確認のダイアログの後、MCP では `clear_sub_periods: true` があるときだけ。閉じたサブの期間とサブの本文・status は消さない。status の取り消し（undo）ではサブの期間は戻らない（確認で防ぐ。PR に書く）。期間・Tickler の検査は書く前に止め、通らなければ何も書かない（テストで確認）。問題なし
- UI: preact で描き、HTML 文字列を DOM に入れていない。問題なし
- サプライチェーン: 依存・lockfile の変更なし。pkm-task の main.js は約 14 KB 増えた（判定・検査・ダイアログの追加分）

## 依存

- 変更なし

## 対応したこと / 残課題

- なし
