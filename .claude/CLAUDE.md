# yamayu-pkm

このリポジトリは Obsidian の Vault そのもの。ノートと、Vault 専用の自作プラグインを同じリポジトリで管理している。
コミュニティプラグインは使わない方針（必要な機能は自作する）。

## 構成

- ノート: リポジトリ直下の通常のフォルダ（素の Markdown。デイリーノートは `daily/`、添付は `asset/`）
- `.obsidian/plugins/vault-git/` : 自作 git 同期プラグインの**ビルド成果物**（`main.js` / `manifest.json`）。モバイルではビルドできないのでコミットする
- `.obsidian/plugins/vault-task/` : 自作タスク管理プラグインのビルド成果物（`main.js` / `manifest.json` / `styles.css`）。同じくコミットする
- `.plugin-src/` : プラグインのソース（pnpm workspace）。Obsidian に索引されないよう隠しフォルダに置いている
- `.plugin-src/docs/adr/` : 設計判断の記録（ADR）。設計を変えるときはここに追記する
- `.plugin-src/docs/design.md` : UI と Obsidian の外観のデザインルール（WCAG 2.2 AA と Material 3 が根拠）。UI を作る・変えるときは従う
- `.plugin-src/packages/design/tokens.json` : デザインの値の正本。プラグインの CSS 変数・`.obsidian/snippets/vault-theme.css`・`docs/design-tokens.md` はここから生成する
- `.obsidian/appearance.json` : Obsidian の外観を固定している（コミュニティテーマなし、スニペットは vault-theme だけ）。変えるとデザインの検査が落ちる
- `.claude/` : Claude Code 用（このファイル、スキル、フック、セキュリティチェックの記録）
- `mise.toml` : Node と pnpm のバージョン

## 開発コマンド

```sh
mise install                 # Node / pnpm
cd .plugin-src
pnpm install --frozen-lockfile
pnpm check                   # 型チェック → ビルド → テスト
pnpm security:scan           # セキュリティチェックの機械的な部分
pnpm task:lint               # タスク管理データ（issue/ routine/ member/ worklog/）の整合性検査
pnpm --filter vault-task preview:ui  # UI のスクリーンショットと、描画した画面の検査
```

## ルール

- ソース（`.plugin-src/**/src`）を変えたら必ず `pnpm build` して、`.obsidian/plugins/<id>/` のビルド成果物も一緒にコミットする
- デザインの値（色・大きさ・余白など）は `tokens.json` にだけ書く。CSS に直接書かない（`pnpm check` が落ちる）。変えたら `pnpm build` して生成物も一緒にコミットする
- `node_modules` やビルド設定などの開発用ファイルを、Vault の見えるフォルダ（隠しフォルダ以外）に置かない
- 依存はバージョン固定（`^` / `~` を使わない）。追加する前に必要性をユーザーに説明する
- 秘密情報（トークンなど）はコード・設定ファイル・コミットに入れない。プラグインでは Obsidian の SecretStorage を使う

## 詳細（必ず従う）

- プラグインの設計と開発の進め方: @docs/plugin-development.md
- セキュリティチェックの頻度と実施ルール: @docs/security-check-schedule.md
- ノートの書式と配置（Markdown リンク、`asset/`、`daily/`）: @docs/vault-conventions.md
