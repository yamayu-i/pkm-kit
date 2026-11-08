# セキュリティチェック 2026-11-08

- 対象 commit: 4e7d9e1（作業ツリーの差分を含む）
- 前回: 2026-11-08 / 5041633
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 passed（秘密情報、data.json、危険な API、依存の固定、lockfile、ビルドの再現性、require、pnpm audit）
- `pnpm check`: 型チェック・ビルド・テストがすべて成功

## 目視レビュー

対象は #99 の差分（`shared/src/header-mount.ts`、`pkm-task/src/header/extension.ts`、`pkm-template/src/obsidian/header-mount.ts`、ビルド成果物）。

- 認証情報: 触れていない。問題なし
- 通信: 通信を足していない。問題なし
- ファイル書き込み: Vault への書き込みは増えていない。差し込み直しは DOM の要素を動かすだけ。問題なし
- データ消失: 該当なし
- UI: HTML 文字列を DOM に入れていない。足した見張り（sizer の親の `MutationObserver`、ヘッダーの `ResizeObserver`、ビューの `scroll` の捕捉）は、閉じたビューと unload で外す。`scroll` は passive で、次のフレームにまとめて確かめるだけ。エディタへの働きかけは CodeMirror の `requestMeasure` を呼ぶだけ。問題なし
- サプライチェーン: 依存の追加・更新なし（lockfile の差分なし）。バンドルの大きさは pkm-task 291,532 → 294,487 バイト、pkm-template 99,230 → 102,187 バイト。見張りの処理を shared から両方に束ねたためで、説明できる

## 依存

- 変更なし。`pnpm outdated` は、依存を変えていないので今回は見ていない

## 対応したこと / 残課題

- なし
