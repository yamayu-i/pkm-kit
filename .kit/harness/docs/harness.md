# 上流のハーネスの設計

上流 pkm-kit を開発するための仕組み（文書・手順・検査・評価）の全体像。ハーネスを変えるときは、まずここを読む。決定の理由は [ADR](adr/README.md) にある。

## 目的

1. Obsidian 上で動くプラグインを作る・改善する（[プラグインの設計と開発](plugin-development.md)）
2. LLM wiki の仕組みを改善する（[LLM wiki の仕組み](../../../.claude/docs/llm-wiki.md)。子向けの文書）
3. 子向けのハーネス（`.claude/`）と、この上流のハーネスを改善する（[改善のサイクル](#改善のサイクル)）
4. 子が更新を取り込めるようにする（[ADR-0010](adr/0010-upstream-updates-and-migrations.md)）

## 前提

前提が変わったら、設計を見直す（[ADR-0001](adr/0001-harness-scope.md)、[ADR-0009](adr/0009-upstream-and-child-vaults.md)）。

- 開発者は 1 人。使うツールは Claude Code だけ（クラウドとローカルの両方）
- 上流は**公開**リポジトリで、仕組みだけを持つ。個人のノートは各子（非公開）にある
- 子は上流を merge で取り込む。上流のファイルは子にも届くので、上流のハーネス（ここ）は子でも見えるが、子では使わない
- コミュニティプラグインは使わない。必要な機能は自作する
- 文書・コミット・Issue・PR は日本語。識別子は英語

## ハーネスの 3 つの層

[ADR-0011](adr/0011-harness-parent-and-child.md)。

| ハーネス | 置き場所 | 所有 | 内容 |
|---|---|---|---|
| 子向け | `.claude/` | 上流 | Vault を使う手順（wiki、タスク管理）と、子の改善のサイクル（harness-note、harness-review、escalate） |
| 子の追加 | `.claude/local/`、`.claude/skills/local-*`、子の記録 | 子 | その子だけの規約・スキルと、子の記録。上流には置かない |
| 上流（ここ） | `.kit/harness/` | 上流 | 上流を開発する手順と、上流の改善のサイクル（kit-note、kit-review） |

- 子向けの `.claude/CLAUDE.md` は、`.kit-local/` がない（上流である）ときにここへ案内する
- ここの手順（`skills/`）は Claude Code のスキルとしては読み込まれない。目次からリンクを辿って読む

## ディレクトリ

| パス | 置くもの |
|---|---|
| `.kit/harness/CLAUDE.md` | 上流の目次。100 行以内 |
| `.kit/harness/docs/` | 上流の設計と規約。`adr/` にハーネスと wiki の ADR |
| `.kit/harness/skills/` | 上流の手順 |
| `.kit/harness/hooks/` | SessionStart フック（上流のときだけ、セキュリティチェックと評価の期限を知らせる） |
| `.kit/harness/notes/` | 上流の開発中の気づき（未処理）。評価で処理したら消す |
| `.kit/harness/reviews/` | 上流の評価のレポートと `last-review.json` |
| `.kit/harness/security/` | セキュリティチェックの記録 |
| `.kit/src/` | プラグインのソース。`docs/adr/` にプラグインの ADR |
| `.kit/bin/`、`.kit/templates/`、`.kit/setup.mjs`、`.kit/lib/`、`.kit/kit.json` | 子が使う CLI、テンプレートの既定、セットアップ |
| `.kit/owned-paths.json` / `.kit/obsidian-required.json` | 上流が持つパスと、Obsidian の設定に必要なキー |

`notes/`、`reviews/`、`security/reports/` は作業の記録なので、目次から辿れなくてよい。それ以外の文書は `CLAUDE.md` から辿れなければならない（`check-docs.mjs .kit/harness` が検査する）。

## 工程

作業の種類ごとに通る工程は [進め方](workflow.md) にある。上流の作業はすべてブランチから PR にする。人が確認するのは、ADR・計画・PR の 3 箇所（大きい変更の場合）。

## 検査

[ADR-0005](adr/0005-checks-in-ci.md)。`node .claude/scripts/verify.mjs` がまとめて実行し、CI も同じスクリプトを呼ぶ。検査のスクリプトは子向けの `.claude/scripts/` にあり、上流でも子でも同じものが動く。

| 検査 | スクリプト | 上流での内容 |
|---|---|---|
| スクリプトのテスト | `.claude/scripts/test/*.test.mjs` | 検査そのものとセットアップの正しさ |
| 文書の構造 | `check-docs.mjs`（`.claude` と `.kit/harness` の両方） | CLAUDE.md の行数、リンク切れ、辿れない文書、スキルの frontmatter |
| wiki の lint | `wiki-lint.mjs` | 上流にノートはないので、ほぼ何も見ない |
| Obsidian の設定 | `check-obsidian-config.mjs` | 上流には `.obsidian/*.json` がない。必要なキーは `.kit/obsidian-required.json` で、デザインの検査が値を確かめる |
| 所有の境界 | `check-kit-paths.mjs` | 追跡しているすべてのファイルが `.kit/owned-paths.json` に当たる（個人のノートや記録が紛れ込まない） |
| プラグイン | `.kit/src` の `pnpm check`、`pnpm security:scan` | 型・ビルド・テスト、成果物（`main.js`、スニペット、`.kit/bin/`）の再現（`--plugin` を付けたとき、CI ではプラグインを変えたとき） |

規約を足す前に、検査で強制できないかを考える。検査を緩める変更は、大きい変更として扱う。

## 権限

`.claude/settings.json`（上流でも子でも同じ）で拒否している操作: force push、PR のマージ、`--no-verify`、`git reset --hard`、`.env` の読み取り。

## 改善のサイクル

[ADR-0011](adr/0011-harness-parent-and-child.md)（[ADR-0006](adr/0006-self-improvement-loop.md) の評価の対象と出力を置き換えた）。

```
上流の開発 ──▶ kit-note（.kit/harness/notes/）───────┐
子からのエスカレーション（Issue のラベル escalation）──┤
CI・移行の fixture の結果 ────────────────────────────┼──▶ kit-review（月 1 回）──▶ 上流の Issue ──▶ 通常の工程で変更（必要なら移行を付ける）
Claude Code・Obsidian の更新 ─────────────────────────┘
```

子の改善のサイクル（harness-note → harness-review → 子で直す / escalate）は、子向けの [ハーネスの設計](../../../.claude/docs/harness.md) にある。

## 未決事項

- wiki のページが増えて index が読み切れなくなったときの検索の仕組み
- 評価を定期実行（無人）に移すか。数回手動で行ってから決める
- 子の更新の取り込み（vault-upgrade）を、GitHub Actions で無人にするか（[ADR-0010](adr/0010-upstream-updates-and-migrations.md)）
- 入れ子の `.claude/skills/` が Claude Code に自動で読み込まれるなら、ここの手順をスキルにする

## 評価の記録

| 日付 | 行った手順 | 起票した Issue |
|---|---|---|

まだ評価していない。
