# 0128: ノートの表示を整えるプラグイン pkm-markdown を有効にし、コアプラグイン「タグ」を無効にする

## 何が変わったか

`.kit/src/docs/adr/0128-markdown-view.md`。

- 新しいプラグイン pkm-markdown が、ノートの表示を整える
  - インラインコード（`` `...` ``）にカーソルを合わせると「コピー」のボタンが出る（スマホでは閲覧モードでタップしたとき）
  - 本文の `#` で始まる語を、タグではなく普通の文字として表示する。押しても検索は開かない。frontmatter の `tags` はそのまま
  - 見出し（H1〜H3）、箇条書き（深さで ● ○ – の 3 段をくり返す記号と、同じ深さの記号をつなぐ薄い線）、番号、チェックボックスの見た目
- 上流が子に求める Obsidian の設定（`.kit/obsidian-required.json`）が変わった。`community-plugins.json` に `pkm-markdown`、`core-plugins.json` の `tag-pane` は `false`

## スクリプトが行うこと（migrate.mjs）

- `.obsidian/community-plugins.json` に `pkm-markdown` を足す。ほかの要素と順は残す
- `.obsidian/core-plugins.json` の `tag-pane` を `false` にする。ほかのキーは残す。ファイルがなければ作る

JSON は Obsidian と同じく、2 つの空白で字下げし、末尾に改行を付けない。

## スクリプトで扱えない場合（AI が行うこと）

- どちらかの JSON が読めない、または形が違う（`community-plugins.json` が配列でない、`core-plugins.json` がオブジェクトでない）: Obsidian が書きかけたか、人が編集中に壊した可能性が高い。直し方をユーザーに確かめる（勝手に作り直さない）

## 確かめ方（check.mjs）

- `community-plugins.json` に `pkm-markdown` が入っている
- `core-plugins.json` の `tag-pane` が `false`

## 取り込んだ後（人が行うこと）

Obsidian を開き直すと、pkm-markdown が読み込まれ、左のサイドバーからタグの一覧が消える。PC とスマホで次を確かめる。

- インラインコードにカーソルを合わせる（スマホは閲覧モードでタップする）と「コピー」が出て、押すと中身がコピーされる
- 本文の `#foo` が普通の文字で表示され、押しても検索が開かない
