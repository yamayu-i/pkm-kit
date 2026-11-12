# 0129: 子の基本の色のスニペットを作り直す

## 何が変わったか

`.kit/src/docs/adr/0129-vault-theme-follow-primary.md`。

`.kit-local/theme.json` で primary を変えた Vault では、書いていない次の色を primary から作るようになった。上流の紫が残らないようにするため。

- `secondary-container`（選んだ行・on の絞り込みチップなどの面）: 面に primary を 16% 混ぜた色
- `on-secondary-container`: その Vault の on-surface
- `on-primary`（primary の上の文字）: 白と暗い文字のうち、比が高い方
- ライトの primary だけを書いていれば、ダークの primary も、ライトを白に寄せて作る

あわせて、子のスニペットに Mermaid の配色の上書きも書くようになった（面・文字・枠を変えた Vault だけ）。書いた値は、これまでどおり作った色より先に使う。

## スクリプトが行うこと（migrate.mjs）

- `theme.json` がある Vault で、`node .kit/bin/theme.mjs check` が通らなければ、`node .kit/bin/theme.mjs build` を実行する。`.obsidian/snippets/pkm-theme-local.css` と `.obsidian/appearance.json`（`accentColor` と `enabledCssSnippets` だけ）が書き直される
- `theme.json` がない Vault では何もしない

## スクリプトで扱えない場合（AI が行うこと）

- `theme.mjs build` が「デザイン規約に合わない」と止まった: primary から作った色が規約に合わない。出力の「primary から作った色」に並んだ色のうち、合わない色の値を `theme.json` に書くと、作らずにその値を使う。どの色にするかはユーザーに確かめる
- `theme.json` が JSON として読めない、知らない色を書いている: 出力のとおりに直す。値はユーザーに確かめる

## 確かめ方（check.mjs）

- `theme.json` がなければ終わり
- あれば `node .kit/bin/theme.mjs check` が通る

## 取り込んだ後（人が行うこと）

- `slide/` があれば `node .kit/bin/slide.mjs build --all` でビルドし直す（閲覧の画面のボタンの色も primary から作るようになった）。vault-upgrade の手順にある
- Obsidian を開き直し、pkm-task の一覧の選んだ行・絞り込みチップ、pkm-template の選んだチップが、薄紫ではなく primary の系統の色になっていることを確かめる。ダークでは primary のボタンの文字も確かめる
