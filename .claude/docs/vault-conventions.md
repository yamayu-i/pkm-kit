# ノートの書式と配置（LLM wiki として運用する）

人も LLM も同じ規約で読み書きできるように、Obsidian 独自の書式を使わず素の Markdown（CommonMark / GFM）で書く。
Obsidian 側の設定は `.obsidian/app.json` / `daily-notes.json` / `core-plugins.json` にある。

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
| `issue/i-N.md` | タスク管理の issue（vault-task。frontmatter が正本。`.plugin-src/docs/adr/` 参照） |
| `routine/r-N.md` | くり返しのタスク |
| `member/m-N.md` | 委任先の人 |
| `worklog/<端末名>/YYYY-MM.jsonl` | 作業の記録（1 行 1 件） |
| `board/<端末名>/YYYY-MM.jsonl` | ボードの操作ログ（1 行 1 操作。追記だけ） |
| `issue/labels.json` / `issue/board-groups.json` | label の色、task board のグループ |
| `sources/` | LLM wiki に取り込んだ元資料（サブフォルダを作らない） |
| `wiki/` | LLM がまとめる wiki のページと、目次・記録・フィードバック（サブフォルダを作らない） |
| それ以外 | 通常のノート。新規ノートの既定の作成先は Vault ルート |

`sources/` と `wiki/` の書式と、LLM がどのノートを変えてよいか（所有の区分）は [LLM wiki の仕組み](llm-wiki.md) にある。

## 編集するとき

- DailyNote（`daily/`）の本文にすでに書かれた内容は、許可なく変更・削除しない。追記は許可する。frontmatter はこの保護の対象外（[ADR-0007](adr/0007-note-format.md)）
- 書式の検査: `node .claude/scripts/wiki-lint.mjs`
- ノートを移動・改名したら、それを指すリンクもすべて書き換える（Obsidian では自動更新が有効だが、Claude Code で編集したときは自分で直す）
- リンク切れを作らない。存在しないノートへのリンクを書くなら、そのノートも作る

## 共通 frontmatter

決定と移行状態は [ADR-0007](adr/0007-note-format.md)。対象はPKMノートの Markdown。temporary/、template/、隠しパス、管理用 README.md（各階層）は除く。除外は入力資料としてLLMに読ませないという意味ではない。

- type: 必須の単一文字列。英小文字とハイフン。話題・進行状態ではなくノートの役割。
- created: このVaultにノートを作った日時。秒までのISO 8601、UTCのZまたはオフセット付き。改名・移動で変えない。
- updated: ノートを変更してコミットした日時。人・AIは入力・更新しない。コミット処理が付与する（[Issue #9](https://github.com/yamayu-i/yamayu-pkm/issues/9)）。
- 自動付与の実装までは updated の空欄・既存値の保持を許す。既存ノートの不明な created は捏造せず、移行時に確認する。
- 記事の公開日時、dailyが表す日付、知識の確認日時は別項目。updated は内容の正確さや最新性を示さない。

新しいtypeを使う前に template/file/<type>.md を作る。テンプレートは初期構造の実例であり、本文の空見出しをすべて埋める義務はない。通常のメモは note とする。追加は独自の項目・構造・処理が必要な場合に限る。

現在のtype: note、daily、source、concept、entity、topic、answer、issue、routine、member、index、log、feedback。

同じ項目名は同じ型にする。tags、aliases、sources はリスト。任意項目は必要時だけ追加する。通常のメタデータはフラットに保つ（既存のデイリーノートに残る board 等、プラグイン管理の項目は例外）。wikiは冒頭に短い要約を書き、主張ごとに出典を付ける。

template/file/ はファイル全体のテンプレート専用。テンプレート変数は引用符で囲み、Source表示で編集する。Obsidian Templatesのフォルダ設定は template/file とする。プラグインの生成コードも同じ規約に従わせ、テンプレートを置くだけで適用済みとは扱わない。
