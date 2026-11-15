# セキュリティチェック 2026-11-15

- 対象 commit: d1ad33b（＋作業ツリーの #139 の変更）
- 前回: 2026-11-15（d1ad33b。#141）
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 PASS
- `pnpm check`（`verify.mjs --plugin` の中で実行）: 成功。テスト 353 件が通る。移行のテスト（`migrations.test.mjs`）52 件が通る
- `pnpm preview:ui`: 問題なし（contrast・target-size・focus-visible・keyboard）

## 目視レビュー

対象: #139（`parent` の削除、移行 0135-sub-issues、旧 ID の読み替え。`src/core/{schema,index,lint,list,load,issue-file}.ts`、`src/obsidian/{writer,capture,board-actions}.ts`、`src/header/IssueHeader.tsx`、`cli/vault-ops.ts`、`.kit/migrations/0135-sub-issues/`）。

- 認証情報・通信: 触れていない。問題なし
- ファイル書き込み: プラグインは書き込みの経路を減らしただけ（`parent` の保存をなくした）。移行は `issue/` の直下の md だけを読み書き・削除する。パスは `readdirSync` で得たファイル名から作り、frontmatter の値（ID）からパスを組み立てない。問題なし
- データ消失: 移行は子のファイルを消すが、消す前に親の md に項目と本文を写し、写さない項目も本文に残す。扱えないもの（ない親・循環・読めない frontmatter・書けない値）は変えずに止め、孫を変換できないときはその祖先の子も消さない。親に足し終えて止まった場合は、足し直さずに子を消す（テストあり）。jsonl は書き換えない。問題なし
- UI: Parent / Children 欄を消しただけ。HTML 文字列は使っていない。問題なし
- サプライチェーン: 依存の追加なし（移行は Node の組み込みの `node:crypto`・`node:fs`・`node:path` だけ）。pkm-task の main.js は 309,661 → 305,704 バイト（親子の UI を消した分）。問題なし

## 依存

- 変更なし（lockfile の差分なし）

## 対応したこと / 残課題

- なし
