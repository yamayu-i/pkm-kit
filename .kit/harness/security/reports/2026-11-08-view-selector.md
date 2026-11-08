# セキュリティチェック 2026-11-08（View を探して開くダイアログ）

- 対象 commit: 5856bb0
- 前回: 2026-11-08（5041633）
- 結果: pass

新しいプラグイン pkm-view-selector を足し、lockfile（importer の追加）とビルド設定（`esbuild.config.mjs`）と `security-scan.mjs` の対象を変えたので行った（ADR-0072）。

## 機械的チェック

- `pnpm security:scan`: 8/8 pass。pkm-view-selector を再現性と require の検査の対象に足した（`allowedRequires` は `obsidian` だけ）
- `pnpm check`: 成功（pkm-git 88、pkm-task 285、pkm-template 154、pkm-html 13、pkm-drawio 68、pkm-ribbon 6、pkm-updates 16、pkm-view-selector 11、design 71、shared 17 件）。`node .claude/scripts/verify.mjs`: すべて成功
- `pnpm outdated`: 出力なし

## 目視レビュー

- **認証情報・通信**: 触れていない。pkm-view-selector は通信しない: 問題なし
- **ファイル書き込み**: pkm-view-selector は書き込まない。移行 0072 は子の `.obsidian/community-plugins.json` と `hotkeys.json` だけを書き、読めない JSON は変えずに check で止める: 問題なし
- **データ消失**: `hotkeys.json` はほかのキーを残し、`editor:insert-link` だけを `[]` にする（ADR-0072 で決めた上書き）: 問題なし
- **プラグイン間の呼び出し**: `app.commands.commands` と `app.viewRegistry.viewByType` を読むだけで、実行するのは `pkm-task:`・`pkm-template:`・`pkm-updates:` の `open-<名前>` のうち、対応する View が登録されたコマンドに限る: 問題なし
- **UI**: 候補は `createDiv` / `createSpan` の `text` と `setIcon` で描く（HTML を入れない）: 問題なし
- **サプライチェーン**: lockfile で新しく入ったパッケージはない（pkm-view-selector の importer が、既存と同じ版の開発用の依存を使うだけ）。`allowBuilds`・`minimumReleaseAge` は変わらない。バンドル: pkm-view-selector 4,702 バイト（新規）。pkm-task・pkm-template・pkm-updates はコマンドに `icon` を足した分だけ

## 依存

- 追加なし

## 対応したこと / 残課題

- 残課題: 実機で、Mod+K でダイアログが開くこと（ノートの編集中にリンクが挿入されないこと）を確かめる
