# 0003: issue の frontmatter の mid_due を soft_deadline に改名する

## 何が変わったか

`.kit/src/docs/adr/0032-action-names-soft-deadline-board-delegate.md`。

- issue の「緩い締切」（守りたいが、過ぎても致命的ではない目標日）のキーを `mid_due` から `soft_deadline` に改名した。`deadline`（固い締切）と対になる名前にした。`mid` は priority の `mid`（中くらい）と読み方がぶつかり、意味が名前から分からなかった
- vault-task・MCP・lint は `soft_deadline` だけを読む。`mid_due` が残っている issue は、lint と vault-task が `legacy-mid-due` のエラーとして出す（値は読まない）

## スクリプトが行うこと（migrate.mjs）

- `issue/*.md` と `template/file/*.md` の frontmatter にある `mid_due:` を `soft_deadline:` にする。値、行末（CRLF も）、ほかの行、本文は変えない
- `.obsidian/types.json`（Obsidian のプロパティの型）の `types` に `mid_due` があれば `soft_deadline` に移す。`soft_deadline` がすでにあれば、`mid_due` を消すだけにする。JSON は Obsidian と同じく、2 つの空白で字下げし、末尾に改行を付けない

デイリーノートと、ほかのフォルダのノートは変えない。

## スクリプトで扱えない場合（AI が行うこと）

- frontmatter に `mid_due` と `soft_deadline` の両方がある issue（またはテンプレート）: どちらかを手で足した可能性が高い。どちらの日付を残すかをユーザーに確かめ、`mid_due` の行を消す（勝手に選ばない）
- `.obsidian/types.json` が JSON として読めない: Obsidian が書きかけたか、人が編集中に壊した可能性が高い。直し方をユーザーに確かめる（勝手に作り直さない）
- 子だけのスキル（`skills/local-*`）、`local/CLAUDE.md`、ノートの本文で `mid_due` に触れていれば、`soft_deadline` に直すかをユーザーに確かめる（スクリプトは本文を変えない）

## 確かめ方（check.mjs）

- `issue/*.md` と `template/file/*.md` の frontmatter に `mid_due` が残っていない
- `.obsidian/types.json` の `types` に `mid_due` が残っていない

あわせて `node .kit/bin/lint.mjs .` で、`legacy-mid-due` のエラーが出ないことを確かめる。

## 取り込んだ後（人が行うこと）

Obsidian を開き直し、緩い締切を入れていた issue の画面で `soft_deadline` の日付が出ることを確かめる。vault-task（`main.js`）と書き換えた issue は同じ取り込みで届くので、ほかの端末は pull するだけでよい。pull する前の端末で緩い締切を入れると `mid_due` で書かれるので、取り込みの前後はほかの端末で issue を編集しない。
