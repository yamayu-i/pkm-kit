# セキュリティチェック 2026-11-12

- 対象 commit: 5b70896
- 前回: 2026-11-12（9e1a5e6）
- 結果: pass

## 機械的チェック

- `pnpm security:scan`: 8/8 passed（秘密情報、data.json、危険な API、依存の固定、lockfile、ビルドの再現性、require、pnpm audit）
- 再現性と require の検査の対象に、新しいプラグイン pkm-markdown を足した。`require` してよいのは `obsidian` と `@codemirror/view`（Obsidian が持つもの）だけ
- `pnpm check`（`node .claude/scripts/verify.mjs --plugin`）: 型チェック・ビルド・テストがすべて通った

## 目視レビュー

差分は新しいパッケージ `packages/pkm-markdown`（`src/core/`・`src/obsidian/`・`src/main.ts`・`styles.css`・`esbuild.config.mjs`）、design パッケージの生成先と検査の対象の追加、移行 0128。

### 認証情報
- 問題なし。認証情報を扱わない

### 通信
- 問題なし。通信しない。外部の URL を持たない

### ファイル書き込み
- 問題なし。Vault のファイルを読み書きしない。ノートは書き換えず、表示の DOM（Obsidian が描いた要素）と CSS だけを変える
- クリップボードには書くだけで、読まない。書けなければ失敗を通知する

### データ消失
- 問題なし。ノートを変えない。移行 0128 は `.obsidian/community-plugins.json` と `core-plugins.json` のキーを 1 つずつ足すだけで、読めない JSON は変えずに止まる（テストで確かめた）

### UI
- 問題なし。HTML 文字列を DOM に入れていない。要素は `createElement` で作り、文字は `textContent` とテキストノードで入れる（本文のタグを置き換えるときも、タグの文字をテキストノードにする）
- ライブプレビューでタグのクリックを止める処理は、`document` の capture で `.markdown-source-view .cm-hashtag` の中の `click` の伝わりだけを止める。既定の動作（`preventDefault`）は止めない

### サプライチェーン
- lockfile の差分は、ワークスペースに pkm-markdown を足した分だけ。devDependencies はすべて既存のパッケージと同じ版（`@codemirror/state` 6.7.6、`@codemirror/view` 6.43.13、esbuild、obsidian、typescript、vitest、@types/node）で、新しいパッケージは入っていない
- `allowBuilds`、`minimumReleaseAge` は変えていない
- 新しいバンドルは `main.js` 7.8 KB

## 依存

- 新しいパッケージなし
- `pnpm outdated`: 出力なし

## 対応したこと / 残課題

- `security-scan.mjs` の対象に pkm-markdown を足した
- 残課題なし
