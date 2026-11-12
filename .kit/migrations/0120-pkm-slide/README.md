# 0120: スライドの一覧のプラグイン pkm-slide を有効にする

## 何が変わったか

`.kit/src/docs/adr/0120-slide-list-view-and-patterns.md`。

- 新しいプラグイン pkm-slide の View「Slides」（コマンド「Open Slides」。View を探すダイアログにも出る）で、`slide/` のデッキを一覧する。左に整理のフォルダの木、右にデッキのカード（1 枚目の縮小、題、枚数、更新日時）
- 整理のフォルダを作る（New folder）、デッキやフォルダの名前を変える（Rename）、別のフォルダに動かす（Move to…、PC ではドラッグ）、デッキのない整理のフォルダを消す（Delete）。動かすと、動いたデッキの `index.html` のパス（`data-deck`）も直すので、ビルドし直さなくてよい
- 上流が子に求める Obsidian の設定（`.kit/obsidian-required.json`）の `community-plugins.json` に `pkm-slide` が増えた

## スクリプトが行うこと（migrate.mjs）

- `.obsidian/community-plugins.json` に `pkm-slide` を足す。ほかの要素と順は残す

JSON は Obsidian と同じく、2 つの空白で字下げし、末尾に改行を付けない。

## スクリプトで扱えない場合（AI が行うこと）

- `community-plugins.json` が JSON として読めない: Obsidian が書きかけたか、人が編集中に壊した可能性が高い。直し方をユーザーに確かめる（勝手に作り直さない）

## 確かめ方（check.mjs）

- `community-plugins.json` に `pkm-slide` が入っている

## 取り込んだ後（人が行うこと）

Obsidian を開き直すと、pkm-slide が読み込まれる。PC とスマホで次を確かめる。

- コマンド「Open Slides」で一覧ペインに Slides が開き、デッキのカードに 1 枚目の縮小が出る
- New folder でフォルダを作り、デッキを Move to…（PC ではドラッグ）で動かすと、ノートからそのデッキへのリンクが書き換わり、`node .claude/scripts/verify.mjs` のスライドの検査が通る
