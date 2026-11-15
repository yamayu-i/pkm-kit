# セキュリティチェック 2026-11-15

- 対象 commit: 3bc7d19（＋作業ツリーの #138 の変更）
- 前回: 2026-11-13（1f55a77）
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 PASS（秘密情報、data.json、危険な API、依存の固定、lockfile、ビルドの再現性、require、pnpm audit）
- `pnpm check`（`verify.mjs --plugin` の中で実行）: 成功。テスト 332 件が通る

## 目視レビュー

対象: #138（サブイシューの読み書き・索引・lint。`pkm-task/src/core/sub-issue.ts`、`load.ts`、`index.ts`、`lint.ts`、`src/obsidian/store.ts`、`cli/read-vault.ts`）と、前回からの 680ceea（slide のビルドで行番号の属性を除く 2 行）。

- 認証情報: 触れていない。問題なし
- 通信: 追加なし。問題なし
- ファイル書き込み: 追加なし。`store.ts` は issue の md を `cachedRead` で読むだけで、書き込む経路は足していない。サブの書き出し（`replaceSubIssues`）は文字列を返すだけで、ファイルへの書き込みは後の Issue（#141・#142）で既存の writer から行う。問題なし
- データ消失: 読めなかったサブのブロックは、元の文字のまま書き戻す（テストあり）。書けない値（`-->`、本文の行頭のマーカー、改行）は `SubIssueFormatError` で止め、壊れた md を書かない。問題なし
- UI: 変更なし。問題なし
- 入力の扱い: サブの YAML は Obsidian の `parseYaml` / `yaml` の `parse` で読み、型は既存の `Reader` で確かめる。`yaml` は既定の core スキーマで、任意の型は作らない。問題なし
- サプライチェーン: 依存の追加なし（lockfile の差分なし）。`allowBuilds`・`minimumReleaseAge` は変えていない。バンドルは pkm-task の main.js が 298,762 → 303,611 バイト（+4.8KB。サブの処理を足した分）、pkm-updates の main.js は pkm-task の `load.ts` を束ねるため同じ分が増える。問題なし

## 依存

- `pnpm outdated`: 更新のある依存の出力なし
- lockfile の差分: なし

## 対応したこと / 残課題

- なし
