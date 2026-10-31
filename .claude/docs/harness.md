# ハーネスの設計

このリポジトリで Claude Code に作業させるための仕組み（文書・スキル・検査・評価）の全体像。ハーネスを変えるときは、まずここを読む。決定の理由は [ADR](adr/README.md) にある。

## 目的

1. Obsidian 上で動くプラグインを作る・改善する（[プラグインの設計と開発](plugin-development.md)）
2. LLM wiki の機能を開発し、wiki の仕組み自体も改善する（[LLM wiki の仕組み](llm-wiki.md)）
3. ハーネス自体を改善する（[自己改善のループ](#自己改善のループ)）

## 前提

前提が変わったら、設計を見直す（[ADR-0001](adr/0001-harness-scope.md)）。

- 開発者は 1 人。使うツールは Claude Code だけ（クラウドとローカルの両方）
- リポジトリは非公開で、Vault そのもの。各端末（PC・モバイル）の Vault Git が main に snapshot を直接 push する
- 開発用のファイルは隠しフォルダに置く（Obsidian に索引させない）
- コミュニティプラグインは使わない。必要な機能は自作する
- 文書・コミット・Issue・PR は日本語。識別子は英語

## 現在地

| 項目 | 状態 |
|---|---|
| ハーネスの初期構成 | 導入済み（2026-10-31） |
| vault-git | 実装済み |
| vault-task | 段階 2（issue 画面のヘッダー・一括登録）まで実装済み（`.plugin-src/docs/adr/`） |
| LLM wiki | 構成と手順を用意した。ページはまだない |

## ディレクトリ

| パス | 置くもの |
|---|---|
| `.claude/CLAUDE.md` | 目次。100 行以内 |
| `.claude/docs/` | 規約と設計。`adr/` にハーネスと wiki の ADR |
| `.claude/skills/` | 手順（スキル） |
| `.claude/scripts/` | 検査と集計のスクリプト（依存なしの Node）。`test/` にテスト |
| `.claude/hooks/` | SessionStart フック（セキュリティチェックと評価の期限） |
| `.claude/notes/` | 作業中の気づき（未処理）。評価で処理したら消す |
| `.claude/reviews/` | 評価のレポートと `last-review.json` |
| `.claude/security/` | セキュリティチェックの記録 |
| `.github/workflows/` | CI |
| `.plugin-src/` | プラグインのソース。`docs/adr/` にプラグインの ADR |

`notes/`、`reviews/`、`security/reports/` は作業の記録なので、目次から辿れなくてよい。それ以外の文書は `CLAUDE.md` から辿れなければならない（`check-docs.mjs` が検査する）。

## 工程

作業の種類ごとに通る工程は [進め方](workflow.md) にある。人が確認するのは、ADR・計画・PR の 3 箇所（大きい変更の場合）。wiki の操作は main に直接コミットする（[ADR-0002](adr/0002-workflow-by-size.md)）。

## 検査

[ADR-0005](adr/0005-checks-in-ci.md)。`node .claude/scripts/verify.mjs` がまとめて実行し、CI も同じスクリプトを呼ぶ。

| 検査 | スクリプト | 内容 |
|---|---|---|
| スクリプトのテスト | `scripts/test/*.test.mjs` | 検査そのものの正しさ |
| 文書の構造 | `check-docs.mjs` | CLAUDE.md の行数、リンク切れ、辿れない文書、スキルの frontmatter |
| wiki の lint | `wiki-lint.mjs` | 書式（Markdown リンク、ルートからのパス、asset/、タブ）、wiki のページの frontmatter、index への掲載 |
| 追記だけか | `check-append-only.mjs` | `wiki(...)` のコミットが所有の区分を守っているか（[ADR-0004](adr/0004-human-notes-append-only.md)） |
| Obsidian の設定 | `check-obsidian-config.mjs` | `.obsidian/` 直下の JSON に末尾改行がないか（Obsidian の保存形式に合わせ、開いたときの差分を防ぐ） |
| プラグイン | `.plugin-src` の `pnpm check` | 型・ビルド・テスト（`--plugin` を付けたとき、CI ではプラグインを変えたとき） |

規約を足す前に、検査で強制できないかを考える。検査を緩める変更は、大きい変更として扱う。

## 権限

`.claude/settings.json` で拒否している操作: force push、PR のマージ、`--no-verify`、`git reset --hard`、`.env` の読み取り。main への push は wiki の操作のために拒否しない（開発の作業では手順で禁じる）。

## 自己改善のループ

[ADR-0006](adr/0006-self-improvement-loop.md)。

```
作業する ──▶ 気づきを記録（harness-note）──┐
wiki を操作 ──▶ wiki/log.md に記録 ────────┤
使う ──▶ wiki/feedback.md に書く（人）────┼──▶ 月 1 回の評価（harness-review）──▶ 改善案の Issue ──▶ 通常の工程で変更
git の履歴 ──▶ usage-report.mjs で集計 ────┘
```

## 未決事項

- wiki のページが増えて index が読み切れなくなったときの検索の仕組み
- 評価を定期実行（無人）に移すか。数回手動で行ってから決める
- クラウドのセッションで main に直接 push できるか。できない場合は、wiki の操作もブランチから PR にする

## 評価の記録

| 日付 | 行った手順 | 起票した Issue |
|---|---|---|

まだ評価していない。
