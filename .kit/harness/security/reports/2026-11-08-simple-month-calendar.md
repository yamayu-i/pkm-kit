# セキュリティチェック 2026-11-08（simple-month-calendar）

- 対象 commit: bfd5a08（このブランチの未コミットの変更を含む）
- 前回: 2026-11-08 / 5041633
- 結果: pass

依存（`packages/shared` に preact）とビルド設定（`esbuild.config.mjs`）を変えたので実施した。対象はこのブランチの変更（ADR-0078）。

## 機械的チェック

- `pnpm security:scan`: 8/8 passed（秘密情報、data.json、危険な API、依存の固定、lockfile、ビルドの再現性、require、pnpm audit）
- `pnpm check`: 型チェック・ビルド・テストすべて成功

## 目視レビュー

- 認証情報・通信・ファイル書き込み・データ消失: 触れていない（UI の部品と日付の解釈だけ）。問題なし
- UI: HTML 文字列を DOM に入れていない（Preact の JSX だけ。矢印は JSX の SVG）。問題なし
- ビルド設定: pkm-task・pkm-template の `esbuild.config.mjs` が、リポジトリ内の `../shared/src/month-calendar.css` を読んで `styles.css` に続けるだけ。外部の取得や実行はない。問題なし

## 依存

- lockfile の差分は `packages/shared` の importers に `preact 10.29.8` が足されただけ。ワークスペースで既に使っている同じ版で、新しいパッケージ（推移的依存を含む）はない
- `allowBuilds`（esbuild のみ）と `minimumReleaseAge` は変えていない
- バンドルサイズ: pkm-task 288,134 → 291,532 bytes、pkm-template 89,206 → 90,815 bytes。共有のカレンダーと入力欄の分。preact はそれぞれ 1 つだけ（テストで確かめる）

## 対応したこと / 残課題

- なし
