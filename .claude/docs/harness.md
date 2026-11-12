# ハーネスの設計（子の Vault）

この Vault で Claude Code に作業させるための仕組み（文書・スキル・検査・評価）の全体像。仕組みの大半は上流 pkm-kit から取り込んでいて、この Vault では変えない。決定の理由は上流の [ADR-0009](../../.kit/harness/docs/adr/0009-upstream-and-child-vaults.md)〜[ADR-0011](../../.kit/harness/docs/adr/0011-harness-parent-and-child.md) にある。

## 前提

- 開発者は 1 人。使うツールは Claude Code（クラウドとローカルの両方）
- この Vault は非公開のリポジトリ。上流（公開）を git の remote `upstream` でつなぎ、merge で更新を取り込む
- 各端末（PC・モバイル）の PKM Git が main に snapshot を直接 push する
- 開発用のファイルは隠しフォルダに置く（Obsidian に索引させない）
- 文書・コミット・Issue・PR は日本語。識別子は英語
- ユーザーへの返事と質問（質問のツールの問い・選択肢・説明を含む）も日本語

## 上流のものと子のもの

| 区分 | 例 | 変えてよいか |
|---|---|---|
| 上流のもの（`.kit/owned-paths.json` に当たる） | `.kit/`、`.claude/CLAUDE.md`・`docs/`・`skills/`（`local-*` を除く）・`scripts/`・`hooks/`・`settings.json`、`.githooks/`、`.github/workflows/` の上流のもの、`.obsidian/plugins/` の上流のプラグインの成果物（ID ごとに書く。子が足した自分のプラグインは子のもの）、`.obsidian/snippets/pkm-theme.css`、`README.md` | 変えない。直したいことは [escalate](../skills/escalate/SKILL.md) で上流に伝える |
| 子のもの | ノート全般、`template/`、`.obsidian/*.json`、`.claude/local/`、`.claude/skills/local-*/`、`.claude/notes/`・`reviews/`・`output-log/`、`.kit-local/` | 変えてよい |

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
| `.claude/output-log/` | 出力の記録（段階ごとの使われ方・時間・モデル・問題。[write-for-reader](../skills/write-for-reader/recording.md)）。評価で読む。消さない |
| `.claude/reviews/` | 評価のレポートと `last-review.json` |
| `.kit-local/config.json` | エスカレーションの方法（`setup.mjs` が書く） |
| `.kit-local/upstream.json` | 取り込んだ上流のコミットと、適用済みの移行 |
| `.kit-local/escalations.json` / `escalations/` | 送ったエスカレーションの記録 / `file` の方法で書いたもの |
| `.kit-local/theme.json` | この Vault の基本の色（任意。下の「基本の色」） |
| `.obsidian/snippets/pkm-theme-local.css` | `theme.json` から CLI が作るスニペット。手で直さない |

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
| 基本の色 | `.kit/bin/theme.mjs check` | `theme.json` が規約を満たすか、スニペットと `appearance.json` が `theme.json` と合っているか（`theme.json` がなければ省略） |
| ADR の一覧 | `adr-index.mjs` | 上流のものの ADR の一覧が、各 ADR の見出しと状態と合っているか |

## 基本の色

全プラグインと Obsidian 本体の基本の色（面・その上の文字・枠・アクセント）は、この Vault だけ変えられる（[ADR-0121](../../.kit/src/docs/adr/0121-vault-theme.md)）。状態の色（status・期限・エラーの色相）は変えられない。

1. `node .kit/bin/theme.mjs list` で、変えられる色と上流の値を見る
2. `.kit-local/theme.json` に、変えたい色だけを書く: `{ "light": { "primary": "#00639b" }, "dark": { "primary": "#8fcdff", "on-primary": "#00344f" } }`。値は不透明な `#rrggbb`
3. `node .kit/bin/theme.mjs build` で反映する。デザイン規約（コントラスト比、面の段差）に合わない組み合わせなら、何も書かずに外れた組み合わせと比を出す。面の色を変えて状態の色の印が見えにくくなるときも止まるので、面の側を直す
   - primary を変えたモードでは、書いていない `secondary-container`（選んだものの面）・`on-secondary-container`・`on-primary` を primary から作る。ライトの primary だけを書けば、ダークの primary もライトから作る（[ADR-0129](../../.kit/src/docs/adr/0129-vault-theme-follow-primary.md)）。作った色が規約に合わなければ、出力の「primary から作った色」のうち合わない色を `theme.json` に書く
4. `slide/` があれば `node .kit/bin/slide.mjs build --all` でスライドをビルドし直す。スライドは primary を `index.html` に埋め込むので、ビルドし直すまで前の色のまま（`verify.mjs` が古いと止める。[ADR-0125](../../.kit/src/docs/adr/0125-slide-vault-primary.md)）
5. `theme.json`、`pkm-theme-local.css`、`appearance.json`（と `slide/` の `index.html`）をコミットする（設定の変更なので、ブランチで行い PR にする）

元の色に戻すときは、`theme.json` と `pkm-theme-local.css` を消し、`node .kit/setup.mjs` で `appearance.json` を戻す。スライドは primary だけがこの Vault の色になる（面と文字は上流の色。デッキの `<meta name="deck-primary">` が先）。Obsidian の中の HTML の閲覧画面と Mermaid の図は、この Vault の色になる。書き出した html と図（pkm-diagram の SVG と PNG）は上流の色のまま。

## 上流の更新の取り込み

[vault-upgrade](../skills/vault-upgrade/SKILL.md)（[ADR-0010](../../.kit/harness/docs/adr/0010-upstream-updates-and-migrations.md)）。ブランチで `upstream/main` を merge し、未適用の移行（`.kit/migrations/`）を `node .kit/migrate.mjs` で実行して、PR にする。移行のスクリプトで済まない部分は、移行の README に従って AI が直す。上流の変更の一覧は `.kit/changes/`（1 変更 1 ファイル。2026-11-08 までは `.kit/CHANGELOG.md`）。

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
