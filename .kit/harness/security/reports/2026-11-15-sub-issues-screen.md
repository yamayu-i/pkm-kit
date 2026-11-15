# セキュリティチェック 2026-11-15

- 対象 commit: d1303da（＋作業ツリーの #142 の変更）
- 前回: 2026-11-15（5538f23。#139）
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 PASS
- `pnpm check`（`verify.mjs --plugin` の中で実行）: 成功。pkm-task のテスト 363 件が通る
- `pnpm preview:ui`: 問題なし（contrast・target-size・focus-visible・keyboard）

## 目視レビュー

対象: #142（issue 画面の「Sub-issues」のカード、Edit のダイアログ、リーディング表示の後処理、writer のサブの操作。`src/header/{SubIssues.tsx,hide-sub-area.ts,IssueHeader.tsx}`、`src/obsidian/{sub-editor.tsx,writer.ts}`、`src/core/sub-issue.ts`、`src/main.ts`）。

- 認証情報・通信: 触れていない。問題なし
- ファイル書き込み: 新しい書き込みは writer の `createSubs`・`moveSub`・`moveSubBefore`・`stepSub`・`deleteSub`（と既存の `updateSub` の検査）。どれも索引にある親の issue の md だけを `vault.process` で書く。ドラッグで受け取る値は合成キーとして索引で引き、見つからなければ何もしない（パスに使わない）。問題なし
- データ消失: 書く前に今の md を読み直して検査し、通らなければ書かない（`process` の中で例外にする）。並べ替えは読めないブロックも含めた並びで行い、ブロックを捨てない（テストあり）。消すのは確認のモーダルの後で、依存されているサブは消さない。問題なし
- UI: サブの本文は Obsidian の `MarkdownRenderer.render` で描き、HTML 文字列を DOM に入れていない。リーディング表示の後処理は、要素にクラスを足すだけ。問題なし
- サプライチェーン: 依存の追加なし。pkm-task の main.js は 305,704 → 337,240 バイト（画面の部品を足した分）。問題なし

## 依存

- 変更なし（lockfile の差分なし）

## 対応したこと / 残課題

- なし
