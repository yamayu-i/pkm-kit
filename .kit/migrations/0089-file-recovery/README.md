# 0089: コアプラグイン「ファイル回復」を有効にする

## 何が変わったか

`.kit/src/docs/adr/0089-git-auto-sync.md`。

- PKM Git は自動で同期し、Git のコミットは同期の区切りだけで作るようになった。保存のたびの細かな版は、Obsidian のコアプラグイン「ファイル回復」が端末内に持つ
- 上流が子に求める Obsidian の設定（`.kit/obsidian-required.json`）が変わった。`core-plugins.json` の `file-recovery` は `true`

## スクリプトが行うこと（migrate.mjs）

- `.obsidian/core-plugins.json` の `file-recovery` を `true` にする。ほかのキーは残す。ファイルがなければ作る

JSON は Obsidian と同じく、2 つの空白で字下げし、末尾に改行を付けない。

## スクリプトで扱えない場合（AI が行うこと）

- `core-plugins.json` が JSON として読めない、またはオブジェクトでない: Obsidian が書きかけたか、人が編集中に壊した可能性が高い。直し方をユーザーに確かめる（勝手に作り直さない）

## 確かめ方（check.mjs）

- `core-plugins.json` の `file-recovery` が `true`

## 取り込んだ後（人が行うこと）

- 各端末で Obsidian を開き直し、設定の「ファイル回復」が有効になっていることを確かめる。保存の間隔と残す期間は、そこで変えられる
