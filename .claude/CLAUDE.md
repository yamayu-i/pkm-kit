# Vault（pkm-kit の子）

このリポジトリは Obsidian の Vault。ノートはこの Vault のもの。仕組み（自作プラグイン、このハーネス、テンプレートの既定、検査）は上流の [pkm-kit](https://github.com/yamayu-i/pkm-kit) から取り込んでいる。
このファイルは目次。詳細は下の文書にあり、作業に必要なものだけを辿って読む。上流と子の分け方は [ハーネスの設計](docs/harness.md)。

この Vault だけの目的・規約・スキルは、末尾で読み込む `local/CLAUDE.md` にある（子のもの。なければ作ってよい）。

ユーザーへの返事と質問（質問のツールの問い・選択肢・説明を含む）は、日本語で書く。識別子とコマンドは英語のままでよい。

## 上流と子

- 上流のもの（`.kit/owned-paths.json` に当たるファイル。`.kit/`、このファイル、`docs/`、`skills/` など）は**変えない**。直したいことは [escalate](skills/escalate/SKILL.md) で上流に伝える。`verify.mjs` が検査する
- この Vault のもの（ノート、`template/`、`.obsidian/*.json`、`local/`、`skills/local-*`、記録）は変えてよい
- `.kit-local/` がないなら、ここは上流（pkm-kit）そのもの。上流の作業（`.kit/` や上流のものを変える）は [上流のハーネス](../.kit/harness/CLAUDE.md) に従う

## 絶対に守るルール

1. DailyNote（`daily/`）の本文にすでに書かれた内容は、許可なく変更・削除しない。追記は許可する。frontmatter はこの保護の対象外
2. force push をしない。PR をマージしない。検査を迂回しない（`--no-verify`、フックを無効にする指定、テストの削除・スキップ）
3. 上流のものを変えない。直したいことは escalate で伝える
4. この Vault のものの仕組み（`template/`、`local/`、`skills/local-*`、設定）を変えるときはブランチで行い PR にする。main に直接コミットしてよいのは wiki の操作と気づきの記録だけ
5. 秘密情報（トークンなど）はノート・設定ファイル・コミットに入れない
6. `node_modules` などの開発用ファイルを、Vault の見えるフォルダに置かない
7. 訂正された、文書にないことを質問した、文書と実際が違った、などが起きたら、その場で記録する（`harness-note`）
8. 学んだことを Claude Code のメモリだけに保存しない。リポジトリに書く

## 作業の流れ

作業の種類ごとの工程とコミットの形式は [進め方](docs/workflow.md)。

| 作業 | スキル |
|---|---|
| 元資料を wiki に取り込む | [wiki-ingest](skills/wiki-ingest/SKILL.md) |
| wiki を根拠に答え、回答を蓄積する | [wiki-query](skills/wiki-query/SKILL.md) |
| wiki を保守する | [wiki-lint](skills/wiki-lint/SKILL.md) |
| デイリーノートを wiki に反映する | [wiki-daily](skills/wiki-daily/SKILL.md) |
| タスク状況を把握し、計画・助言・振り返りを行う | [task-coach](skills/task-coach/SKILL.md) |
| 間違っていそうな worklog を一緒に直す | [worklog-review](skills/worklog-review/SKILL.md) |
| 気づきを記録する（直す先が子か上流かも書く） | [harness-note](skills/harness-note/SKILL.md) |
| 上流を変えないと直らないことを上流に伝える | [escalate](skills/escalate/SKILL.md) |
| 上流の更新を取り込む（merge と移行） | [vault-upgrade](skills/vault-upgrade/SKILL.md) |
| この Vault のハーネスと wiki の使い方を評価する（月 1 回） | [harness-review](skills/harness-review/SKILL.md) |

## 文書の地図

| 知りたいこと | 読む文書 |
|---|---|
| 上流と子の分け方、この Vault のハーネスの全体像 | [ハーネスの設計](docs/harness.md) |
| 作業の進め方、git、コミットの形式 | [進め方](docs/workflow.md) |
| LLM wiki の構成と書式、所有の区分 | [LLM wiki の仕組み](docs/llm-wiki.md) |
| 設計判断（ハーネス・wiki・プラグイン） | [ADR](../.kit/harness/docs/adr/README.md)（上流のもの） |

ノートの書式と配置（必ず従う）:

@docs/vault-conventions.md

## コマンド

```sh
mise install                          # Node
node .claude/scripts/verify.mjs       # 検査（ノートの書式、上流のものを変えていないか、Obsidian の設定）
node .claude/scripts/wiki-lint.mjs    # ノートの書式
node .kit/bin/lint.mjs .              # タスク管理データ（issue/ routine/ member/ worklog/ board/ statuslog/）の整合性検査
node .kit/setup.mjs --dry-run         # セットアップ（エスカレーションの方法、Obsidian の設定）。何をするかだけを表示
node .kit/migrate.mjs --status        # 未適用の移行（取り込みは vault-upgrade）
```

## このファイルを変えるとき

- 上流のものなので、子の Vault では変えない（escalate）。上流では 100 行以内に保つ（`check-docs.mjs` が検査する）

この Vault だけの規約:

@local/CLAUDE.md
