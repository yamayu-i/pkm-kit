# 0102: 図のプラグインの名前を pkm-drawio から pkm-diagram にする

## 何が変わったか

`.kit/src/docs/adr/0102-diagram-three-methods.md`。

- 図のプラグインが Draw.io の図だけでなく、Mermaid・D2・SVG の図すべてを扱うようになるので、ID を `pkm-drawio` から `pkm-diagram` にした。表示名は `PKM Diagram`
- コマンド ID はプラグイン ID から決まるので、`pkm-drawio:create-diagram` は `pkm-diagram:create-diagram` になった
- CLI は `.kit/bin/diagram.mjs` になった。`.kit/bin/drawio.mjs` は旧名として残り、同じものを動かす
- 上流の merge で `.obsidian/plugins/pkm-drawio/` の `main.js` などが消え、`pkm-diagram/` が届く

## スクリプトが行うこと（migrate.mjs）

- `.obsidian/community-plugins.json` の `pkm-drawio` を `pkm-diagram` にする（順と、ほかのプラグインは残す。新旧の両方があれば新しい方だけを残す）
- `.obsidian/hotkeys.json` のキー `pkm-drawio:<コマンド>` を `pkm-diagram:<コマンド>` にする（新旧の両方があれば新しい方を残す）
- `template/snippet/*.md` の frontmatter の `command: pkm-drawio:<コマンド>` を `pkm-diagram:<コマンド>` にする（ADR-0094）
- この端末の `.obsidian/plugins/pkm-drawio/data.json` があれば `pkm-diagram/data.json` へ写す（今の pkm-drawio は設定を保存しないので、ふつうはない）。古いフォルダに `data.json` だけが残り、新しい方と同じ中身なら、古いフォルダを消す

## スクリプトで扱えない場合（AI が行うこと）

- `check.mjs` が「JSON として読めない」で止まったとき: そのファイルをユーザーに見せ、Obsidian で開き直すか手で直すかを確かめる（勝手に作り直さない）。直したら `node .kit/migrate.mjs` をもう一度実行する
- 古いフォルダに `data.json` 以外のファイルが残っているときは、残す。動きに影響しない（Obsidian は `community-plugins.json` にない ID を読み込まない）ので、消すかどうかはユーザーに確かめる
- ノートや `local/` の手順に `.kit/bin/drawio.mjs` が書かれていても、そのまま動く。直すなら `diagram.mjs` にする

## 確かめ方（check.mjs）

- `community-plugins.json`・`hotkeys.json` に `pkm-drawio` が残っていない（ファイルがなければ通る）
- `template/snippet/*.md` に `command: pkm-drawio:` が残っていない
- この端末に `pkm-drawio/data.json` があれば、`pkm-diagram/data.json` もある

## 取り込んだ後（人が行うこと）

- 各端末で Obsidian を開き直す（同期で受け取っただけの端末も）。開き直すまでは古いプラグインが動いたまま
