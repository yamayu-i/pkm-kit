# 0002: リボンのボタンを vault-ribbon にまとめ、コアプラグインのデイリーノートを無効にする

## 何が変わったか

`.kit/src/docs/adr/0029-ribbon-plugin.md`。

- 「今日のデイリーノートを開く」と「Daily を開く」のリボンのボタンを、新しいプラグイン vault-ribbon が続けて並べるようになった（デイリーノートが上）。vault-template と vault-task は、このボタンを出さない（コマンドは残る）
- コアプラグイン「デイリーノート」は使っていない（デイリーノートの作成は vault-template が行う）。それなのにボタンが残っていたので、無効にする
- 上流が子に求める Obsidian の設定（`.kit/obsidian-required.json`）が変わった。`core-plugins.json` の `daily-notes` は `false`、`community-plugins.json` に `vault-ribbon`、`daily-notes.json` は求めない

## スクリプトが行うこと（migrate.mjs）

- `.obsidian/core-plugins.json` の `daily-notes` を `false` にする。ほかのキーは残す
- `.obsidian/community-plugins.json` に `vault-ribbon` を足す
- `.obsidian/daily-notes.json` が、以前の上流の値と Obsidian の既定の値（`folder: "daily"`、`format: "YYYY/MM/YYYY-MM-DD"`、`template: ""`、`autorun: false`）だけなら消す。ほかの値があれば、子が変えたものとして残す（コアプラグインを無効にしたので、使われないだけ）

JSON は Obsidian と同じく、2 つの空白で字下げし、末尾に改行を付けない。

## スクリプトで扱えない場合（AI が行うこと）

- `core-plugins.json` か `community-plugins.json` が JSON として読めない: Obsidian が書きかけたか、人が編集中に壊した可能性が高い。直し方をユーザーに確かめる（勝手に作り直さない）
- 子が `daily-notes.json` の値を変えていて残った: `vault-upgrade` の PR の本文に、残したことと、使われなくなったことを書く。消すかどうかはユーザーが決める

## 確かめ方（check.mjs）

- `core-plugins.json` の `daily-notes` が `false`
- `community-plugins.json` に `vault-ribbon` が入っている
- 既定の値だけの `daily-notes.json` が残っていない

## 取り込んだ後（人が行うこと）

Obsidian を開き直すと、vault-ribbon が読み込まれる。リボンに「今日のデイリーノートを開く」（カレンダー）と「Daily を開く」（チェック付きのカレンダー）が続けて並ぶことを確かめる。並びが違う場合は、端末ごとにリボンの並びや表示を変えていないか（Obsidian の設定 → 外観 → リボン）を確かめる。
