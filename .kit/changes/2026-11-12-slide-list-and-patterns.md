## 変更の要約

- **移行 0120-pkm-slide**: 新しいプラグイン pkm-slide を `community-plugins.json` に足す
- pkm-slide の View「Slides」（コマンド「Open Slides」。View を探すダイアログにも出る）で、`slide/` のデッキを一覧する。左に整理のフォルダの木、右にデッキのカード（1 枚目の縮小・題・枚数・更新日時）。New folder / Rename / Move to… / Delete（デッキのないフォルダ）、PC ではドラッグで動かす。Copy link でノートに貼るリンクをコピーする。動かすと、ノートからのリンクと、デッキの `index.html` のパスが直る（ビルドし直さなくてよい）
- スライドのデザイン: 画像を切り取らずに枠へ全部入れる（全面に敷く `figure.bleed` だけは端が切れる）。カード・手順・層などの箱を同じ角丸の四角にそろえ、一覧の縮小表示でも丸くならないようにした。カードが細くても、見出しを語の途中（「アイリッ / シュ」）で折り返さず、文字を縮める。カードが 5 つ以上なら段に分ける
- パターンを 27 個足した（34 → 61）: cover-image、profile、image-statement、two-numbers、question、myth-fact、options、spectrum、venn、split-image、grid、hub、pyramid、roadmap、journey、flow、chart-column、progress、chart-waterfall、heatmap、gallery、screenshot-compare、risks、ask、retro、scr、faq。写真とカードの変種（`figure.bleed` / `left` / `right`、`card outline` / `numbered` / `pick`、`img.cover-img` / `avatar`）も足した
- vault-upgrade の手順に、取り込んだ後に `node .kit/bin/slide.mjs build --all` でスライドをビルドし直す段を足した
- 子への影響: 移行 0120（pkm-slide を有効にする）。`slide/` にデッキがあれば、取り込みでビルドし直す（vault-upgrade の手順。今回の CLI の変更で `index.html` が変わる）。PC とスマホで確かめること: Slides の一覧と縮小の表示、New folder、Move to…（ノートのリンクが書き換わり、`verify.mjs` のスライドの検査が通る）、PC でのドラッグ。ブラウザで確かめること: 写真やスクリーンショットが切れずに入る、カードの見出しが語の途中で折り返さない
