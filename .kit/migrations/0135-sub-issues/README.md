# 0135: issue の親子関係を廃止し、子の issue を親の md の中のサブイシューにする

## 何が変わったか

`.kit/src/docs/adr/0135-sub-issues-in-issue-file.md`。

- issue の `parent`（親子関係）を廃止した。親と子が別々のファイルで、全体像を 1 か所で見られず、子の数だけ ID が増えたため
- 代わりに、issue の md の本文の末尾に、サブ 1 件ごとに `<!-- sub-issue ... -->` のブロックを置く。サブの外からは合成キー `i-12#k3f9a2` で指す
- pkm-task・MCP・lint は `parent` を読まない。`parent` が残っている issue は、lint と pkm-task が `legacy-parent` のエラーとして出す

## スクリプトが行うこと（migrate.mjs）

- `parent` を持つ issue（子）を、いちばん上の祖先の md の末尾にサブとして足す。孫（子の子）も、いちばん上の祖先のサブにする（サブのサブは持たない）。並びは、子の ID の順に、その子の孫を続ける
- サブに写す項目: `summary`・`status`・`delegated_to`・`scheduled`・`soft_deadline`・`deadline`・`estimated`・`created`。`migrated_from` に子の ID を入れる。子の本文は、サブの本文にする
- サブが持たない項目（`priority`・`label`・`related`・`status-detail`・`revisit`・`reviewed` など）に値があれば、捨てずに、サブの本文の先頭に `（移行で残した項目）priority: high / label: [仕事]` の 1 行で残す。`schema`・`type`・`id`・`parent`・`updated` は残さない
- サブの `id` は、子の ID から決める（何度実行しても同じ）
- 子のファイルを消す。ID は再利用しない
- ほかの issue の `related` にある子の ID を、合成キーにする（`related` の行を 1 行のリストに書き直す。ほかの行は変えない）
- worklog・statuslog・board の jsonl は書き換えない（追記だけの記録のため）。pkm-task は、`migrated_from` から、旧 ID の行をそのサブの行として読む
- 親の本文とほかのサブ、行末（CRLF も）は変えない。`node .kit/migrate.mjs --dry-run` で、変換する子と残す値を一覧にする

## スクリプトで扱えない場合（AI が行うこと）

扱えない issue は変えずに、`check` が失敗して止まる。孫を変換できないときは、その祖先の子も変えない。

- **parent の issue がない**: 親を消したか、別の Vault から写した可能性が高い。ほかの issue の親にするか、`parent` の行を消して独立した issue にするかを、ユーザーに確かめる
- **親子関係が循環している**: どれをいちばん上にするかをユーザーに確かめ、その issue の `parent` の行を消す
- **frontmatter が読めない**（入れ子の値、`|` などの複数行の値、壊れた YAML）: 読める形に直してよいかをユーザーに確かめる。勝手に値を捨てない
- **書けない値**（項目の値に `-->`、子の本文の行頭に `<!-- sub-issue`）: 値を言い換えるかをユーザーに確かめる
- 直したら `node .kit/migrate.mjs` をもう一度実行する
- 子だけのスキル（`skills/local-*`）、`local/CLAUDE.md`、ノートの本文で `parent` や子の issue に触れていれば、サブイシューに合わせて直すかをユーザーに確かめる（スクリプトは本文を変えない）

## 確かめ方（check.mjs）

- `issue/*.md` の frontmatter に `parent` が残っていない
- ほかの issue の `related` に、サブにした子の ID が残っていない

あわせて `node .kit/bin/lint.mjs .` で、`legacy-parent`・`invalid-sub-issue`・`dangling-related` のエラーが出ないことを確かめる。

## 取り込んだ後（人が行うこと）

この移行は子の issue のファイルを消す。取り込む前に、すべての端末で同期を済ませ、取り込みの前後はほかの端末で issue を編集しない（古い端末が子の issue を書き戻すと、消したファイルが戻る）。戻ったときは、`node .kit/migrate.mjs` をもう一度実行すると、足し直さずに子のファイルを消す。

Obsidian を開き直し、親の issue の md の末尾にサブのブロックがあること、`node .kit/bin/lint.mjs .` が通ることを確かめる。
