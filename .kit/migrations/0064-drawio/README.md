# 0064: Draw.io の図を扱うプラグイン pkm-drawio を有効にする

## 何が変わったか

`.kit/src/docs/adr/0064-drawio-diagrams.md`。

- 新しいプラグイン pkm-drawio。図は `asset/<名前>.drawio.svg`（Draw.io の編集可能 SVG。描画と編集用 XML を 1 ファイルに持つ）に置き、`![説明](asset/<名前>.drawio.svg)` で参照する。表示は Obsidian の標準の画像の表示のまま（プラグインがなくても見える）
- 図の画像にマウスを載せる（タッチでは押す）と「コピー（PNG / SVG / XML）」「編集」が出る。編集は Obsidian の中で Draw.io（embed.diagrams.net）を開き、保存すると `.drawio.svg` を書き換える。編集にはネットワークが要る
- コマンド「図を作る」「ノートの図を編集」「ノートの図をコピー」「このノートを tmp/ に書き出す（図を埋め込む）」。書き出しは、図を編集用 XML を除いた SVG の data URI にして埋め込む。PC では `node .kit/bin/drawio.mjs export <ノート>` でも同じことができる
- pkm-git は、両側で変わった `.drawio.svg` を行単位でマージせず、リモート版と `<名前> (conflict …).drawio.svg` を残す。`.gitattributes` も PC の Git で同じようにする
- 上流が子に求める Obsidian の設定（`.kit/obsidian-required.json`）の `community-plugins.json` に `pkm-drawio` が増えた

## スクリプトが行うこと（migrate.mjs）

- `.obsidian/community-plugins.json` に `pkm-drawio` を足す。ほかの要素と順は残す

JSON は Obsidian と同じく、2 つの空白で字下げし、末尾に改行を付けない。

## スクリプトで扱えない場合（AI が行うこと）

- `community-plugins.json` が JSON として読めない: Obsidian が書きかけたか、人が編集中に壊した可能性が高い。直し方をユーザーに確かめる（勝手に作り直さない）

## 確かめ方（check.mjs）

- `community-plugins.json` に `pkm-drawio` が入っている

## 取り込んだ後（人が行うこと）

Obsidian を開き直すと、pkm-drawio が読み込まれる。PC とスマホで次を確かめる。

- コマンド「図を作る」で Draw.io が開き、保存すると `asset/` に図ができ、ノートに参照が入る
- ノートの図にマウスを載せる（スマホでは押す）と「コピー」「編集」が出る（Reading view と Live Preview の両方）
- 「編集」で開き、保存して閉じると図が変わる。開き直しても全ページが残っている
- 「コピー」の PNG / SVG / XML を、ほかのアプリに貼り付けられる（貼り付け先によっては SVG がテキストになる）
- 「このノートを tmp/ に書き出す」で `tmp/` にできたファイルで、図が見える
