# セキュリティチェック 2026-11-16

- 対象 commit: 4ed649a
- 前回: 2026-11-16 7a5294e（2026-11-16-pick-in-progress-and-watch）
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 passed（秘密情報・data.json・危険な API・依存の固定・lockfile・ビルドの再現性・require・pnpm audit）
- `pnpm check`: 型チェック・ビルド・テストすべて成功（pkm-task 610 件ほか）

## 目視レビュー

前回からの差分は #184（Watch の欄）と #183（status の遷移表）。`src/obsidian/` の変更は pkm-task の TaskWriter と画面の部品だけ。

- 認証情報: 対象外（pkm-task はトークンを扱わない）。問題なし
- 通信: 追加の通信なし（`requestUrl`・`fetch` の追加なし）。問題なし
- ファイル書き込み: 書き込み先は既存の issue の md（`processFrontMatter`・`vault.process`）、board / worklog / statuslog の jsonl だけで、パスの組み立ては変えていない。MCP（`cli/vault-ops.ts`）も既存の `writeTextInVault` と `updateIssueFrontmatter` を通る。新しい書き込みの経路はない。遷移表にない status の遷移は書く前に例外にする（書く量が減る方向の変更）。問題なし
- データ消失: status の書き込みは付随の項目（`delegated_to`・`revisit`・`tickler`・期限・`scheduled`）を ADR-0183 の表どおりに消す。消す項目は従来の `closePatch` などと同じで、ヘッダーから canceled / closed にしたときに期限・Tickler が残っていた食い違いを揃えた。取り消しのトースト（undo）は変える前の値を書き戻し、表の検査を通さない。問題なし
- UI: HTML 文字列を DOM に入れていない（Preact の JSX と Obsidian の Menu だけ）。問題なし
- サプライチェーン: 依存・lockfile・`pnpm-workspace.yaml` の変更なし。main.js は 416,607 → 432,895 バイト（+4%。#184 の Watch の欄と、遷移表・ボタンの部品の追加による）

## 依存

- `pnpm outdated`: 出力なし
- lockfile の差分: なし

## 対応したこと / 残課題

- なし
