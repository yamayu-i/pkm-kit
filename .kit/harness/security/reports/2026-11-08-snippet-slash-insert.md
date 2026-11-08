# セキュリティチェック 2026-11-08（スニペットの挿入）

- 対象 commit: cde7caa
- 前回: 2026-11-08（5041633）
- 結果: pass

pkm-template に依存（`@codemirror/state`・`@codemirror/view` を開発用に）を足し、`src/obsidian/` にエディタへの挿入とファイルの読み込みを足し、`security-scan.mjs` の許可を変えたので行った（ADR-0060）。

## 機械的チェック

- `pnpm security:scan`: 8/8 pass。「バンドルが Obsidian の提供するもの以外を require しない」は、pkm-template の `allowedRequires` に `@codemirror/state` を足して通した（pkm-task と同じく Obsidian 本体が提供するもの。esbuild の `external` に入っており同梱しない）
- `pnpm check`: 成功（pkm-git 85、pkm-task 285、pkm-template 130、pkm-html 13、pkm-ribbon 3、design 67、shared 17 件）。`node .claude/scripts/verify.mjs --plugin`: すべて成功

## 目視レビュー

- **認証情報・通信**: 触れていない: 問題なし
- **ファイル書き込み**: ファイルへの書き込みはない。挿入は開いているエディタへの `replaceRange` だけ。読み込みは `template/snippet/` 直下の md（Vault の索引）と `.kit/templates/snippet/` 直下の md（アダプタの `list` の結果だけ。パスは固定のフォルダ名と一覧のファイル名から作り、`/` を含む名前は除く）: 問題なし
- **コードの実行**: スニペットの本文は既存の `renderTemplate` で文字列として展開するだけ。`eval` などは使わない: 問題なし
- **UI**: 候補は `el.setText` で出す（HTML を入れない）: 問題なし
- **サプライチェーン**: lockfile で新しく入ったパッケージはない（pkm-task が使う同じ版を pkm-template の devDependencies に足しただけ。`packages/shared` の位置が並べ替わった）。`allowBuilds`・`minimumReleaseAge` は変わらない。pkm-template のバンドルは 76,479 → 84,606 バイト（スニペットの処理の分）

## 依存

- `pnpm outdated`: 更新なし。lockfile で増えたパッケージはない

## 対応したこと / 残課題

- 残課題: モバイル（iOS / Android の入力方式）で、`/` の入力が `input.type` として届き候補が出るかは実機で確かめる
