# ハーネスの設計（子の Vault）

この Vault で Claude Code に作業させるための仕組み（文書・スキル・検査・評価）の全体像。仕組みの大半は上流 pkm-kit から取り込んでいて、この Vault では変えない。決定の理由は上流の [ADR-0009](../../.kit/harness/docs/adr/0009-upstream-and-child-vaults.md)〜[ADR-0011](../../.kit/harness/docs/adr/0011-harness-parent-and-child.md) にある。

## 前提

- 開発者は 1 人。使うツールは Claude Code（クラウドとローカルの両方）
- この Vault は非公開のリポジトリ。上流（公開）を git の remote `upstream` でつなぎ、merge で更新を取り込む
- 各端末（PC・モバイル）の Vault Git が main に snapshot を直接 push する
- 開発用のファイルは隠しフォルダに置く（Obsidian に索引させない）
- 文書・コミット・Issue・PR は日本語。識別子は英語
- ユーザーへの返事と質問（質問のツールの問い・選択肢・説明を含む）も日本語

## 上流のものと子のもの

| 区分 | 例 | 変えてよいか |
|---|---|---|
| 上流のもの（`.kit/owned-paths.json` に当たる） | `.kit/`、`.claude/CLAUDE.md`・`docs/`・`skills/`（`local-*` を除く）・`scripts/`・`hooks/`・`settings.json`、`.githooks/`、`.github/workflows/` の上流のもの、`.obsidian/plugins/*/` の成果物、`.obsidian/snippets/vault-theme.css`、`README.md` | 変えない。直したいことは [escalate](../skills/escalate/SKILL.md) で上流に伝える |
| 子のもの | ノート全般、`template/`、`.obsidian/*.json`、`.claude/local/`、`.claude/skills/local-*/`、`.claude/notes/`・`reviews/`、`.kit-local/` | 変えてよい |

両方が書きたくなるものは、重ね合わせで境界をまたがないようにしている。

| もの | 上流 | この Vault |
|---|---|---|
| 目次 | `.claude/CLAUDE.md` | `.claude/local/CLAUDE.md`（目次の末尾で読み込む） |
| スキル | `.claude/skills/<名前>/` | `.claude/skills/local-<名前>/` |
| テンプレート | `.kit/templates/` | `template/`（同じ名前のファイルと、設定の項目を上書きする） |
| Obsidian の設定 | `.kit/obsidian-required.json`（必要なキー） | `.obsidian/*.json`（ほかのキーは自由） |

## ディレクトリ（子のもの）

| パス | 置くもの |
|---|---|
| `.claude/local/CLAUDE.md` | この Vault だけの目的・規約・スキルへのリンク |
| `.claude/skills/local-*/` | この Vault だけのスキル。`local/CLAUDE.md` からリンクする（`check-docs.mjs` が、目次から辿れるかを検査する） |
| `.claude/notes/` | 作業中の気づき（未処理）。評価で処理したら消す |
| `.claude/reviews/` | 評価のレポートと `last-review.json` |
| `.kit-local/config.json` | エスカレーションの方法（`setup.mjs` が書く） |
| `.kit-local/upstream.json` | 取り込んだ上流のコミットと、適用済みの移行 |
| `.kit-local/escalations.json` / `escalations/` | 送ったエスカレーションの記録 / `file` の方法で書いたもの |

`notes/`、`reviews/` は作業の記録なので、目次から辿れなくてよい。

## 工程

作業の種類ごとに通る工程は [進め方](workflow.md) にある。wiki の操作は main に直接コミットする。この Vault のものの仕組み（`template/`、`local/` など）を変えるときは、ブランチから PR にする。

## 検査

`node .claude/scripts/verify.mjs` がまとめて実行し、CI（`.github/workflows/vault.yml`）も同じものを呼ぶ。

| 検査 | スクリプト | 内容 |
|---|---|---|
| スクリプトのテスト | `scripts/test/*.test.mjs` | 検査そのものの正しさ |
| 文書の構造 | `check-docs.mjs` | CLAUDE.md の行数、リンク切れ、辿れない文書、スキルの frontmatter |
| wiki の lint | `wiki-lint.mjs` | 書式（Markdown リンク、ルートからのパス、asset/、タブ）、wiki のページの frontmatter、index への掲載 |
| 追記だけか | `check-append-only.mjs` | `wiki(...)` のコミットが所有の区分を守っているか |
| Obsidian の設定 | `check-obsidian-config.mjs` | `.obsidian/` の JSON に末尾改行がないか。上流が求める必要なキーが入っているか |
| 所有の境界 | `check-kit-paths.mjs` | 取り込んだ上流のコミット（`.kit-local/upstream.json`）から、上流のものが変わっていないか |
| 移行 | `.kit/migrate.mjs --status` | 未適用の移行がないか |

## 上流の更新の取り込み

[vault-upgrade](../skills/vault-upgrade/SKILL.md)（[ADR-0010](../../.kit/harness/docs/adr/0010-upstream-updates-and-migrations.md)）。ブランチで `upstream/main` を merge し、未適用の移行（`.kit/migrations/`）を `node .kit/migrate.mjs` で実行して、PR にする。移行のスクリプトで済まない部分は、移行の README に従って AI が直す。上流の変更の一覧は `.kit/CHANGELOG.md`。

- SessionStart フック（`upstream-status.mjs`）が、未取り込みの更新と未適用の移行を知らせる
- `verify.mjs` と CI は、未適用の移行があると失敗する

## 改善のサイクル

この Vault の使い方は、この Vault で良くする。上流を変えないと直らないことは、上流に伝える（[ADR-0011](../../.kit/harness/docs/adr/0011-harness-parent-and-child.md)）。

```
作業する ──▶ 気づきを記録（harness-note。直す先: 子・上流・未定）──┐
wiki を操作 ──▶ wiki/log.md に記録 ────────────────────────────┤
使う ──▶ wiki/feedback.md に書く（人）──────────────────────────┼──▶ 月 1 回の評価（harness-review）─┬─▶ 子で直せる ─▶ この Vault の Issue ─▶ 通常の工程
git の履歴 ──▶ usage-report.mjs で集計 ────────────────────────┘                                    └─▶ 上流を変えないと直らない ─▶ escalate
```

- 作業が止まる上流の問題（移行の失敗、プラグインが使えない）は、評価を待たずにその場で escalate を提案する
- 上流で直ったものは、上流の更新を取り込むと届く。評価のときに、送った件の状態を確かめる

## 権限

`.claude/settings.json` で拒否している操作: force push、PR のマージ、`--no-verify`、`git reset --hard`、`.env` の読み取り。main への push は wiki の操作のために拒否しない（ほかの作業では手順で禁じる）。
