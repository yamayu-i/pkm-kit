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
| `sources/` | LLM wiki に取り込んだ元資料（サブフォルダを作らない） |
| `wiki/` | LLM がまとめる wiki のページと、目次・記録・フィードバック（サブフォルダを作らない） |
| それ以外 | 通常のノート。新規ノートの既定の作成先は Vault ルート |

`sources/` と `wiki/` の書式と、LLM がどのノートを変えてよいか（所有の区分）は [LLM wiki の仕組み](llm-wiki.md) にある。

## 編集するとき

- 人が書いたノート（`daily/` やルートのメモ）の既存の内容は、ユーザーの許可なく変えない。LLM ができるのは追記だけ（[ADR-0004](adr/0004-human-notes-append-only.md)）
- 書式の検査: `node .claude/scripts/wiki-lint.mjs`
- ノートを移動・改名したら、それを指すリンクもすべて書き換える（Obsidian では自動更新が有効だが、Claude Code で編集したときは自分で直す）
- リンク切れを作らない。存在しないノートへのリンクを書くなら、そのノートも作る
