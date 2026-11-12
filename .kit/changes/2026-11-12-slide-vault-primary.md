## 変更の要約

- スライドの primary が、この Vault の基本の色（`.kit-local/theme.json` の `light.primary` / `dark.primary`）になる（ADR-0125）。`<meta name="deck-primary">` を書いていないデッキに効き、閲覧の画面（バー・Review などのボタン）の primary も同じ色になる。面と文字の色は上流のまま。デッキに `deck-primary` を書けば、そちらが先
- `theme.json` の primary がスライドの面との比 4.5:1 に足りなければ、スライドのビルドが止まり、直し方を出す
- `theme.mjs build` は、`slide/` があれば `slide.mjs build --all` でビルドし直すよう知らせる
- 子への影響: 移行なし。`theme.json` で primary を変えている Vault では、取り込みの `node .kit/bin/slide.mjs build --all`（vault-upgrade の手順）で既存のスライドの `index.html` が変わる（一緒にコミットする）。ブラウザで確かめること: スライドの強調の色と、上のバーのボタンが Vault の primary になっていること
