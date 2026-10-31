# yamayu-pkm

このリポジトリは Obsidian の Vault そのもの。ノートと、Vault 専用の自作プラグインを同じリポジトリで管理している。
コミュニティプラグインは使わない方針（必要な機能は自作する）。

## 構成

- ノート: リポジトリ直下の通常のフォルダ（素の Markdown。デイリーノートは `daily/`、添付は `asset/`）
- `.obsidian/plugins/vault-git/` : 自作 git 同期プラグインの**ビルド成果物**（`main.js` / `manifest.json`）。モバイルではビルドできないのでコミットする
- `.plugin-src/` : プラグインのソース（pnpm workspace）。Obsidian に索引されないよう隠しフォルダに置いている
- `.plugin-src/docs/adr/` : 設計判断の記録（ADR）。設計を変えるときはここに追記する
- `.claude/` : Claude Code 用（このファイル、スキル、フック、セキュリティチェックの記録）
- `mise.toml` : Node と pnpm のバージョン

## 開発コマンド

```sh
mise install                 # Node / pnpm
cd .plugin-src
pnpm install --frozen-lockfile
pnpm check                   # 型チェック → ビルド → テスト
pnpm security:scan           # セキュリティチェックの機械的な部分
```

## ルール

- ソース（`.plugin-src/**/src`）を変えたら必ず `pnpm build` して、`.obsidian/plugins/vault-git/main.js` も一緒にコミットする
- `node_modules` やビルド設定などの開発用ファイルを、Vault の見えるフォルダ（隠しフォルダ以外）に置かない
- 依存はバージョン固定（`^` / `~` を使わない）。追加する前に必要性をユーザーに説明する
- 秘密情報（トークンなど）はコード・設定ファイル・コミットに入れない。プラグインでは Obsidian の SecretStorage を使う

## 詳細（必ず従う）

- プラグインの設計と開発の進め方: @docs/plugin-development.md
- セキュリティチェックの頻度と実施ルール: @docs/security-check-schedule.md
- ノートの書式と配置（Markdown リンク、`asset/`、`daily/`）: @docs/vault-conventions.md
