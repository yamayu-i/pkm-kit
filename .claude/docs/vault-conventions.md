# ノートの書式と配置（LLM wiki として運用する）

人も LLM も同じ規約で読み書きできるように、Obsidian 独自の書式を使わず素の Markdown（CommonMark / GFM）で書く。
Obsidian 側の設定は `.obsidian/app.json` / `core-plugins.json` にある（上流が求める値は `.kit/obsidian-required.json`）。デイリーノートの置き場所と作成は vault-template が行い、コアプラグインのデイリーノートは使わない（`.kit/src/docs/adr/0029-ribbon-plugin.md`）。

## 書式

- リンクは Markdown リンク。wiki リンク（`[[...]]`）・`![[...]]` の埋め込みは使わない
- リンク先は **Vault ルートからのパス**で、拡張子 `.md` まで書く: `[タイトル](topics/foo.md)`
  - 先頭に `/` を付けない。空白などは `%20` にエンコードするか、ファイル名に空白を使わない
  - 見出しへのリンクは `[…](topics/foo.md#見出し)`
- 画像・PDF などの添付は `asset/` 直下に置き、`![説明](asset/foo.png)` で参照する
- 改行は Markdown どおり（段落は空行で区切る。単独の改行は表示上つながる）
- インデントはスペース 2 つ（タブを使わない）
- メタデータは先頭の YAML frontmatter に書く（`title`, `tags`, `created`, `updated`, `sources` など）
- Canvas（`.canvas`）・Bases（`.base`）は使わない（コアプラグインも無効にしている）

## 配置

| パス | 内容 |
|---|---|
| `daily/YYYY/MM/YYYY-MM-DD.md` | デイリーノート |
| `asset/` | 添付ファイル（サブフォルダを作らない） |
| `issue/i-N.md` | タスク管理の issue（frontmatter が正本。`.kit/src/docs/adr/` 参照）。vault-task でも vault-template でも作れる |
| `routine/r-N.md` | くり返しのタスク（同上） |
| `member/m-N.md` | 委任先の人（同上）。`name`（本名）、`nickname`（呼び名）、`alias`（検索と候補に出す短い呼び方。単数の文字列）を持つ（`.kit/src/docs/adr/0035-member-view-and-fields.md`）。`label` は issue / routine と共用で任意（`.kit/src/docs/adr/0036-member-labels-and-list-sort.md`） |
| `worklog/<端末名>/YYYY-MM.jsonl` | 作業の記録（1 行 1 件） |
| `board/<端末名>/YYYY-MM.jsonl` | ボードの操作ログ（1 行 1 操作。追記だけ） |
| `statuslog/<端末名>/YYYY-MM.jsonl` | issue の status の変化の記録（1 行 1 件。追記だけ。分析用で、status の正本は frontmatter） |
| `issue/labels.json` / `issue/board-groups.json` | label の色、task board のグループ |
| `sources/` | LLM wiki に取り込んだ元資料（サブフォルダを作らない） |
| `wiki/` | LLM がまとめる wiki のページと、目次・記録・フィードバック（サブフォルダを作らない） |
| `tmp/` | 一時ファイル（外部共有用の書き出し、自分が一時的に見るだけのファイル）。git で管理せず、端末間で同期しない。この規約（frontmatter、リンクの書式）の対象外。サブフォルダを作ってよい（[ADR-0038](../../.kit/src/docs/adr/0038-tmp-folder.md)） |
| それ以外 | 通常のノート。新規ノートの既定の作成先は Vault ルート |

`sources/` と `wiki/` の書式と、LLM がどのノートを変えてよいか（所有の区分）は [LLM wiki の仕組み](llm-wiki.md) にある。

## 編集するとき

- DailyNote（`daily/`）の本文にすでに書かれた内容は、許可なく変更・削除しない。追記は許可する。frontmatter はこの保護の対象外（[ADR-0007](../../.kit/harness/docs/adr/0007-note-format.md)）
- 書式の検査: `node .claude/scripts/wiki-lint.mjs`
- ノートを移動・改名したら、それを指すリンクもすべて書き換える（Obsidian では自動更新が有効だが、Claude Code で編集したときは自分で直す）
- リンク切れを作らない。存在しないノートへのリンクを書くなら、そのノートも作る
- `tmp/` の外のノートから `tmp/` へリンクしない（ほかの端末にはないので、リンク切れになる）。残したいもの・ほかの端末でも見たいものは `tmp/` の外に置く

## 共通 frontmatter

決定と移行状態は [ADR-0007](../../.kit/harness/docs/adr/0007-note-format.md)。対象はPKMノートの Markdown。tmp/、template/、隠しパス、管理用 README.md（各階層）は除く。除外は入力資料としてLLMに読ませないという意味ではない。

- type: 必須の単一文字列。英小文字とハイフン。話題・進行状態ではなくノートの役割。
- created: このVaultにノートを作った日時。秒までのISO 8601、UTCのZまたはオフセット付き。改名・移動で変えない。
- updated: ノートを作成・変更した日時。作成時は created と同じ値を入れる（テンプレートとプラグインのコードが入れる。[ADR-0008](../../.kit/harness/docs/adr/0008-updated-on-create.md)）。変更したときの更新は、コミット処理が付与する（[Issue #9](https://github.com/yamayu-i/yamayu-pkm/issues/9)）。人・AIは手で入力・更新しない。
- タイトル（ノートの先頭に出る名前）: `title`、なければ `name`、なければファイル名。daily は `title` を持たず、ファイル名の日付（`2026-11-01 SUN`）を使う。ファイル名とタイトルは一致しなくてよい。Obsidian 標準のタイトルは `.obsidian/app.json` の `showInlineTitle: false` で隠し、vault-task か vault-template のヘッダーが出す（[ADR-0026](../../.kit/src/docs/adr/0026-note-views.md)）。
- コミット時の付与（[ADR-0028](../../.kit/src/docs/adr/0028-auto-updated.md)）: 変更したノートの updated の行だけを書き換える。対象は frontmatter のある md（tmp/、template/、隠しパス、README.md を除く）。値は秒までの ISO 8601（オフセット付き）で、1 回のコミットでは同じ値。削除・未変更・同期で受け取っただけのノートには付けない。コミット済みの `sources/` は変更しない。PC の Git CLI は `git config core.hooksPath .githooks`（1 回）で有効になり、Vault Git は自動。既存ノートの空欄は `node .kit/bin/stamp-updated.mjs --migrate` で埋める。
- ノートを作る仕組み（テンプレート、プラグインのコード）を足すときは、作成時に created と updated の両方を入れる。
- 記事の公開日時、dailyが表す日付、知識の確認日時は別項目。updated は内容の正確さや最新性を示さない。

新しいtypeを使う前にテンプレートを作る（上流で全 Vault に足すなら `.kit/templates/file/<type>.md`、その Vault だけなら `template/file/<type>.md`）。テンプレートは初期構造の実例であり、本文の空見出しをすべて埋める義務はない。通常のメモは note とする。追加は独自の項目・構造・処理が必要な場合に限る。

現在のtype: note、daily、source、concept、entity、topic、answer、issue、routine、member、index、log、feedback。

同じ項目名は同じ型にする。tags、aliases、sources はリスト。任意項目は必要時だけ追加する。通常のメタデータはフラットに保つ（既存のデイリーノートに残る board 等、プラグイン管理の項目は例外）。wikiは冒頭に短い要約を書き、主張ごとに出典を付ける。

テンプレートは、上流の既定（`.kit/templates/file/` と `.kit/templates/config.json`）に、その Vault のもの（`template/file/` と `template/config.json`）を重ねて使う。同じ名前のテンプレートはその Vault のものが優先し、`template/config.json` には上流と違う項目だけを書く（[ADR-0009](../../.kit/harness/docs/adr/0009-upstream-and-child-vaults.md)）。どちらもファイル全体のテンプレート専用。テンプレート変数は引用符で囲み、Source表示で編集する。自作プラグイン vault-template でテンプレート選択・変数展開・生成先フォルダの解決を行う。プラグインの生成コードも同じ規約に従わせ、テンプレートを置くだけで適用済みとは扱わない。

issue / routine / member は vault-task 専用ではない。vault-task でも vault-template でも作れる Vault の通常のノートで、どちらで作っても同じ項目が揃う。テンプレートは vault-task が正常に動くのに必要な項目（schema、id、summary / name、status / repeat など）をすべて持つ。ID（`i-N` / `r-N` / `m-N`）は連番で、テンプレートでは `{{id:i}}` などで振る（[ADR-0023](../../.kit/src/docs/adr/0023-template-id-and-daily.md)）。連番の規則は vault-task と vault-template の両方が持つ。
