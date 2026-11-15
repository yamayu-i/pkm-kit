# セキュリティチェック 2026-11-15

- 対象 commit: a4167af（＋作業ツリーの #141 の変更）
- 前回: 2026-11-15（a4167af。#140）
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 PASS
- `pnpm check`（`verify.mjs --plugin` の中で実行）: 成功。テスト 351 件が通る

## 目視レビュー

対象: #141（MCP のサブイシューの操作、`parent` の引数の削除。`cli/mcp.ts`、`cli/vault-ops.ts`、`src/core/sub-issue.ts`）。プラグイン（`main.js`）は変わらない。

- 認証情報・通信: 触れていない。問題なし
- ファイル書き込み: 新しい書き込みは、`createSubIssuesOnDisk`・`moveSubIssueOnDisk`・`deleteSubIssueOnDisk`・`updateSubIssueOnDisk`。どれも索引にある issue のパス（`issue/i-N.md`）だけを `resolveInVault` を通して書く。MCP の引数（親の ID、合成キー）は索引で引き、パスの組み立てには使わない。問題なし
- 入力の検査: 書く前に `checkSubIssues` で status・日付・分・委任先・依存関係・書けない値（`-->`、改行、本文の行頭のマーカー）を確かめ、通らなければ何も書かない（テストあり）。引数の型が違うものは `subPatch` で止める。問題なし
- データ消失: サブの組み替えは、ほかのサブ（読めなかったブロックを含む）と親の部分を元のまま残す。サブを消しても worklog の行は残す。ほかのサブが依存しているサブは消せない。問題なし
- サプライチェーン: 依存の追加なし。`.kit/bin/mcp.mjs` だけが変わる。問題なし

## 依存

- 変更なし（lockfile の差分なし）

## 対応したこと / 残課題

- なし
