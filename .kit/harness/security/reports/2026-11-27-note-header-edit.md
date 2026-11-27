# セキュリティチェック 2026-11-27

- 対象 commit: 780d54a
- 前回: 2026-11-25 31c1058
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 passed（秘密情報、data.json、危険な API、依存の固定、lockfile、ビルドの再現性、require、pnpm audit）
- `pnpm check`（`verify.mjs --plugin`）: 型チェック・ビルド・テストがすべて成功（pkm-template 215 件、pkm-task 699 件を含む）
- `pnpm --filter pkm-task preview:ui`: 問題なし

## 目視レビュー

前回からの差分は、main に入った pkm-task の Projects の横スクロールバー（80d9e31、4b0985f）と、このブランチの ADR-0238（pkm-template のヘッダーからの frontmatter の編集）・ADR-0239（pkm-task のサブのカードの題の編集）。追加行に innerHTML などの HTML の挿入、通信、eval の類はない。

- 認証情報: 触れていない。問題なし
- 通信: 新しい通信はない。問題なし
- ファイル書き込み: pkm-template に新しい書き込みの経路が 1 つ増えた（`NoteHeader.tsx` の `app.fileManager.processFrontMatter`）。対象は、開いているビューのファイル（`view.file.path` を `vault.getFileByPath` で引いたもの）だけで、Vault の外は指せない。書くキーは固定の 5 つ（title・tags・origin・retrieved・sources）で、値は `parseEdit` が文字列か文字列のリストに整えたもの。本文には触れない。pkm-task のサブの題は、既存の保存の経路（`updateSub` / エディタの範囲の置き換え）をそのまま使う。問題なし
- データ消失: `processFrontMatter` は frontmatter を書き直すので、ほかの項目の引用符などの書き方が変わることがある（値は変わらない。ADR-0238 の影響に記載）。本文は変わらない。問題なし
- UI: HTML 文字列を DOM に入れていない（preact の JSX）。ヘッダーの Origin のリンクは、今までどおり http / https だけを `href` にする（`isWebUrl`）。問題なし
- サプライチェーン: 依存・lockfile・`pnpm-workspace.yaml` の変更なし。main.js は pkm-template が約 6 KB 増、pkm-task が約 12 KB 増（機能の追加分と、main から入った Projects の変更）

## 依存

- `pnpm outdated`: 出力なし
- lockfile の差分なし

## 対応したこと / 残課題

なし
