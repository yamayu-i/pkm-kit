# 0004: member に nickname と alias を足す

## 何が変わったか

`.kit/src/docs/adr/0035-member-view-and-fields.md`。

- member（`member/m-N.md`）の項目を、`name`（本名）・`nickname`（自分が呼んでいる呼び名）・`alias`（検索と委任先の候補に出す短い呼び方。単数の文字列）の 3 つにした
- vault-task は、`nickname` がなければ `name` を、`alias` がなければ ID を使う。移行しなくても動くが、ノートを開いたときに項目が揃うよう、既存の member にも値を入れる
- 新しく作る member（vault-task、テンプレート `.kit/templates/file/member.md`）には、`name` と `nickname` に登録名、`alias` に ID が入る

## スクリプトが行うこと（migrate.mjs）

- `member/*.md` の frontmatter に `nickname` がなければ、`name` と同じ値（引用符も書いてあるまま）を `name` の行の後ろに足す
- `alias` がなければ、`id` の値を `nickname` の行の後ろに足す
- すでにある項目、ほかの行、行末（CRLF も）、本文は変えない。空の `nickname:` / `alias:` も、あるものとして変えない

デイリーノート、`template/`、ほかのフォルダのノートは変えない。

## スクリプトで扱えない場合（AI が行うこと）

- `name` か `id` が 1 行の値で書かれていない member（値がない、`|` / `>` のブロック、複数行）: スクリプトは変えず、`check.mjs` が失敗する。そのノートを開き、`name`（本名）と `nickname`（呼び名）、`alias`（短い呼び方。分からなければ ID）をユーザーに確かめて足す（勝手に決めない）
- 子の `template/file/member.md`（上流のテンプレートを上書きしている）: スクリプトは変えず、`check.mjs` も失敗しない。`nickname: "{{title}}"` と `alias: "{{id:m}}"` を足すかをユーザーに確かめる。足さないと、そのテンプレートで作った member には `nickname` と `alias` が入らない（vault-task は `name` と ID を使うので動く）
- 子だけのスキル（`skills/local-*`）、`local/CLAUDE.md` で member の項目（`name` だけ）に触れていれば、`nickname` と `alias` を書き足すかをユーザーに確かめる

## 確かめ方（check.mjs）

- `member/*.md` のすべてに、frontmatter の `nickname` と `alias` がある

あわせて `node .kit/bin/lint.mjs .` で、member の問題が出ないことを確かめる。

## 取り込んだ後（人が行うこと）

Obsidian を開き直し、Members（コマンド「Members を開く」か、Tasks サイドバー）で member が `@alias - nickname (name)` の形で並ぶことを確かめる。member を開き、ヘッダーで nickname・name・alias を直す。vault-task（`main.js`）と書き換えた member は同じ取り込みで届くので、ほかの端末は pull するだけでよい。
