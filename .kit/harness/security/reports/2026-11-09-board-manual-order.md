# セキュリティチェック 2026-11-09

- 対象 commit: d80c11c
- 前回: 2026-11-09 3bba419（2026-11-09-remove-drawio.md）
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 passed（秘密情報、data.json、危険な API、依存の固定、lockfile、main.js と .kit/bin の再現、require、pnpm audit）
- `pnpm check` 相当: 型チェック・ビルドは成功。テストは並列実行で vitest のキャッシュのフォルダの取り合い（ENOTEMPTY）が起きたため、`pnpm -r --workspace-concurrency=1 test` で順に実行し、すべて成功（1 件は以前からの skip）

## 目視レビュー

対象は #114（task board のグループの中の手動の並べ替え）。変更は pkm-task の core（board-log / board / index / load）、`src/obsidian/board-actions.ts`、`src/views/Board.tsx`、CLI（MCP）の `get_board`、スタイル。

### 認証情報
- 問題なし。認証情報に触れる変更はない

### 通信
- 問題なし。通信の経路は変えていない

### ファイル書き込み
- 問題なし。`moveCard` は既存の `writer.appendBoardOps` で、端末のボードの操作ログ（`board/<端末名>/YYYY-MM.jsonl`）に追記するだけ。パスは既存の `boardLogPath`（端末名の無害化）で決まる
- 書く値（`group` と ID の並び）は画面のグループの鍵と、索引にある ID から作る。ドラッグで受け取る値は JSON として読み、読めなければ ID の文字列として扱う。どちらも JSON に直列化して書くので、ログの行を壊さない。読むときは `parseOp` が形を検査し、不正な行は問題として飛ばす

### データ消失
- 問題なし。追記だけで、既存の行は書き換えない。`order` は `BoardState` を変えない

### UI
- 問題なし。HTML 文字列を DOM に入れていない（Preact の JSX と Obsidian の Menu）

### サプライチェーン
- 問題なし。依存・lockfile・`pnpm-workspace.yaml` の変更なし
- バンドルサイズ: pkm-task の main.js は 294,487 → 299,239 バイト（並べ替えの UI とロジックの分）

## 依存

- `pnpm outdated`: isomorphic-git 1.44.11、playwright 1.65.0（dev）、vitest 5.1.0（dev）、preact 11.2.0 などに更新あり。脆弱性の修正ではないので今回は上げない
- lockfile の差分なし

## 対応したこと / 残課題

- なし
