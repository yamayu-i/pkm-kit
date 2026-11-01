# yamayu-pkm

このリポジトリは Obsidian の Vault そのもの。ノートと、Vault 専用の自作プラグインと、Claude Code 用のハーネスを同じリポジトリで管理している。
コミュニティプラグインは使わない方針（必要な機能は自作する）。

このファイルは目次。詳細は下の文書にあり、作業に必要なものだけを辿って読む。ハーネスの全体像は [ハーネスの設計](docs/harness.md)。

## 目的

1. Obsidian 上で動くプラグインを作る・改善する
2. LLM wiki の機能を開発し、wiki の仕組み自体も利用実態を踏まえて改善する
3. ハーネス自体を改善する

## 構成

- ノート: リポジトリ直下の見えるフォルダ（素の Markdown）。デイリーノートは `daily/`、添付は `asset/`、LLM wiki は `sources/`（元資料）と `wiki/`
- `.obsidian/plugins/<id>/` : 自作プラグイン（vault-git、vault-task、vault-template）の**ビルド成果物**（`main.js` / `manifest.json` / `styles.css`）。モバイルではビルドできないのでコミットする
- `.plugin-src/` : プラグインのソース（pnpm workspace）と ADR（`docs/adr/`）。UI のデザインルールは `docs/design.md`（UI を作る・変えるときは従う）。デザインの値の正本は `packages/design/tokens.json`（CSS に直接書かない）
- `.obsidian/appearance.json` と `.obsidian/snippets/vault-theme.css` : Obsidian の外観の固定（後者は生成物）。変えるとデザインの検査が落ちる
- `.claude/` : ハーネス（このファイル、文書、スキル、検査スクリプト、フック、記録）
- `.github/workflows/` : CI
- `mise.toml` : Node と pnpm のバージョン

## 絶対に守るルール

1. 開発の作業（プラグイン・ハーネス・設定）はブランチで行い PR にする。main に直接コミットしてよいのは wiki の操作と気づきの記録だけ
2. force push をしない。PR をマージしない。検査を迂回しない（`--no-verify`、テストの削除・スキップ）
3. DailyNote（`daily/`）の本文にすでに書かれた内容は、許可なく変更・削除しない。追記は許可する。frontmatter はこの保護の対象外
4. 設計判断を含む変更は、実装の前に ADR を書いて合意する
5. 秘密情報（トークンなど）はコード・設定ファイル・コミットに入れない。プラグインでは Obsidian の SecretStorage を使う
6. 依存はバージョン固定（`^` / `~` を使わない）。追加する前に必要性をユーザーに説明する
7. ソース（`.plugin-src/**/src`）を変えたら必ず `pnpm build` して、`.obsidian/plugins/<id>/` のビルド成果物も一緒にコミットする
8. `node_modules` やビルド設定などの開発用ファイルを、Vault の見えるフォルダに置かない
9. 訂正された、文書にないことを質問した、文書と実際が違った、などが起きたら、その場で記録する（`harness-note`）
10. 学んだことを Claude Code のメモリだけに保存しない。リポジトリに書く

## 作業の流れ

作業の種類ごとの工程とコミットの形式は [進め方](docs/workflow.md)。

| 作業 | スキル |
|---|---|
| 計画を立てて承認を得る（大きい変更は ADR と Issue、小さい変更はチャット） | [dev-plan](skills/dev-plan/SKILL.md) |
| テストを先に書いて実装し、検査を通す | [dev-implement](skills/dev-implement/SKILL.md) |
| 自分でレビューして PR を出す | [dev-pr](skills/dev-pr/SKILL.md) |
| 中断と再開 | [dev-handoff](skills/dev-handoff/SKILL.md) |
| 元資料を wiki に取り込む | [wiki-ingest](skills/wiki-ingest/SKILL.md) |
| wiki を根拠に答え、回答を蓄積する | [wiki-query](skills/wiki-query/SKILL.md) |
| wiki を保守する | [wiki-lint](skills/wiki-lint/SKILL.md) |
| デイリーノートを wiki に反映する | [wiki-daily](skills/wiki-daily/SKILL.md) |
| 気づきを記録する | [harness-note](skills/harness-note/SKILL.md) |
| ハーネスと wiki の仕組みを評価する（月 1 回） | [harness-review](skills/harness-review/SKILL.md) |
| セキュリティチェック（週 1 回） | [security-check](skills/security-check/SKILL.md) |

## 文書の地図

| 知りたいこと | 読む文書 |
|---|---|
| ハーネスの全体像、現在地、未決事項 | [ハーネスの設計](docs/harness.md) |
| 作業の進め方、git、コミットの形式 | [進め方](docs/workflow.md) |
| ハーネスと wiki の設計判断 | [ADR](docs/adr/README.md) |
| プラグインの設計と開発 | [プラグインの設計と開発](docs/plugin-development.md) |
| LLM wiki の構成と書式、所有の区分 | [LLM wiki の仕組み](docs/llm-wiki.md) |
| セキュリティチェックの頻度と実施ルール | [実施ルール](docs/security-check-schedule.md) |

ノートの書式と配置（必ず従う）:

@docs/vault-conventions.md

## コマンド

```sh
mise install                          # Node / pnpm
node .claude/scripts/verify.mjs       # ハーネスと Vault の検査（--plugin でプラグインの pnpm check も）
node .claude/scripts/wiki-lint.mjs    # ノートの書式
cd .plugin-src
pnpm install --frozen-lockfile
pnpm check                            # 型チェック → ビルド → テスト
pnpm security:scan                    # セキュリティチェックの機械的な部分
pnpm task:lint                        # タスク管理データ（issue/ routine/ member/ worklog/ board/）の整合性検査
pnpm task:worklog-review              # 間違っていそうな worklog の候補（worklog-review スキルから使う）
pnpm --filter vault-task preview:ui   # UI のスクリーンショットと、描画した画面の検査
```

## このファイルを変えるとき

- 100 行以内に保つ（`check-docs.mjs` が検査する）。詳細は `docs/` に書き、ここにはリンクだけを置く
- `docs/` に文書を足したら、ここから辿れるようにする
