# セキュリティチェック 2026-11-08

- 対象 commit: 496d874
- 前回: 2026-11-08 / 5041633
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 passed（秘密情報、data.json、危険な API、依存の固定、lockfile、ビルドの再現性、require、pnpm audit）
- `pnpm check`: 型チェック・ビルド・テストがすべて成功

## 目視レビュー

対象は ADR-0077 の差分（`shared/src/header-mount.ts` の追加、`pkm-task/src/header/extension.ts`、`pkm-template/src/obsidian/header-mount.ts`、CSS、ビルド成果物）。

- 認証情報: 触れていない。問題なし
- 通信: 通信を足していない。問題なし
- ファイル書き込み: 差し込みは DOM の要素を作って置くだけで、Vault への書き込みは増えていない（ヘッダーの中の編集は既存の writer を通る）。問題なし
- データ消失: 該当なし
- UI: HTML 文字列を DOM に入れていない（`document.createElement` と preact の `render` だけ）。`MutationObserver` は sizer の直下の子だけを見て、閉じたビューと unload で外す。問題なし
- サプライチェーン: 依存の追加・更新なし（lockfile の差分なし）。バンドルの大きさは pkm-task 292,133 → 293,780 バイト、pkm-template 88,225 → 90,227 バイト。差し込みの仕組みを shared から両方に束ねたためで、説明できる

## 依存

- 変更なし。`pnpm outdated` は、依存を変えていないので今回は見ていない

## 対応したこと / 残課題

- Obsidian の内部の DOM（`.cm-sizer`、`.markdown-preview-sizer`、`.metadata-container`）への依存が pkm-task にも広がった。安全性の問題ではないが、Obsidian を更新したときは実機で確かめる（ADR-0077）
- pkm-task の `package.json` に、もう使っていない `@codemirror/state`・`@codemirror/view` が残っている（バンドルには入らない）。外すのは別の作業として提案する
