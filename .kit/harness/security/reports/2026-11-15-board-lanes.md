# セキュリティチェック 2026-11-15

- 対象 commit: c6bff6c（＋作業ツリーの #147 の変更）
- 前回: 2026-11-15（8aa0b41。2026-11-15-sub-issues-worklog.md）
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 PASS
- `pnpm check`（`verify.mjs --plugin` の中で実行）: 成功（pkm-task 390 件、移行のテスト 55 件）
- `pnpm preview:ui`: 問題なし（contrast・target-size・focus-visible・keyboard）

## 目視レビュー

対象: #145〜#147（ボードの欄・★・並び、サブのカード、グループの廃止、移行 0137-board-lanes）。`src/core/{board,board-log,board-lanes,load,index,summary,board-note,metrics}.ts`、`src/obsidian/{board-actions,modals,writer,store}.ts`、`src/views/{Board,DailyView}.tsx`、`cli/{mcp,vault-ops,read-vault}.ts`、`.kit/migrations/0137-board-lanes/`、`.kit/setup.mjs`。

- 認証情報・通信: 触れていない。問題なし
- ファイル書き込み（プラグイン）: 新しい経路はない。★ と並びは既存の `appendBoardOps`（端末名のフォルダの board の jsonl に追記）だけ。サブを載せるときの `scheduled` は既存の `updateSub`（索引にあるサブの親の md だけに書き、書く前に検査する）。問題なし
- ファイル書き込み（MCP）: `order_card`・`star_card` は、鍵がその日のボードに載っていることと、`before` が同じ欄にあること、`on` が真偽値であることを確かめてから board の jsonl に追記する。`add_to_board`・`carry_issues` のサブは、索引にある合成キーだけを受け付け、`updateSubIssueOnDisk`（既存。親の md を検査してから書く）で `scheduled` を変える。サブは Inbox に戻せない。問題なし
- ファイル書き込み（移行）: 消すのは固定のパス `issue/board-groups.json` だけ。書くのは `routine/` 直下の通常のファイル（`readdirSync` の `isFile`）と `template/file/routine.md`（`lstatSync` で通常のファイルのときだけ。シンボリックリンクはたどらない）。変えるのは frontmatter の `group` の 1 行だけで、読めない値なら変えずに check が止める。問題なし
- データ消失: board の jsonl は書き換えない（以前の `place` と `group` 付きの `order` は読んで捨てる）。グループの分けは失われるが、ADR-0137 で決めた仕様で、`.kit/changes/` と移行の README に書いた。消したサブを指すカードは出さず、締めを止めない（記録は残る）。問題なし
- UI: preact の要素だけで描き、HTML 文字列を入れていない。ドラッグで運ぶのはカードの鍵の文字列で、鍵は索引にあるカードの中からだけ探す。問題なし
- サプライチェーン: 依存の追加なし。pkm-task の main.js は 355,559 → 349,380 バイト（グループの画面を消した分）。問題なし

## 依存

- 変更なし（lockfile の差分なし）

## 対応したこと / 残課題

- 移行の `template/file/routine.md` が、シンボリックリンクをたどって Vault の外に書かないように、`lstatSync` で通常のファイルに限った
