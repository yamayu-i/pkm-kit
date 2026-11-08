# 0058: 自作プラグインの名前を vault-* から pkm-* にする

## 何が変わったか

`.kit/src/docs/adr/0058-pkm-plugin-names.md`。

- 自作プラグインの ID を `vault-git` / `vault-task` / `vault-template` / `vault-ribbon` / `vault-html` から `pkm-git` / `pkm-task` / `pkm-template` / `pkm-ribbon` / `pkm-html` にした。表示名は `PKM Git` など
- テーマのスニペットを `vault-theme.css` から `pkm-theme.css` にした
- コマンド ID はプラグイン ID から決まるので、`vault-task:open-daily` は `pkm-task:open-daily` になった
- 上流の merge で `.obsidian/plugins/vault-*/` の `main.js` などが消え、`pkm-*/` が届く。古いフォルダには、git に入らない `data.json`（端末ごとの設定）だけが残る

## スクリプトが行うこと（migrate.mjs）

- `.obsidian/community-plugins.json` の `vault-*` の ID を `pkm-*` にする（順と、子が足したプラグインは残す。新旧の両方があれば新しい方だけを残す）
- `.obsidian/appearance.json` の `enabledCssSnippets` の `vault-theme` を `pkm-theme` にする
- `.obsidian/hotkeys.json` のキー `vault-<名前>:<コマンド>` を `pkm-<名前>:<コマンド>` にする（新旧の両方があれば新しい方を残す）
- この端末の `.obsidian/plugins/vault-*/data.json` を `pkm-*/data.json` へ写す（新しい方がなければ）。古いフォルダに `data.json` だけが残り、新しい方と同じ中身なら、古いフォルダを消す

## スクリプトで扱えない場合（AI が行うこと）

- `check.mjs` が「JSON として読めない」で止まったとき: そのファイルをユーザーに見せ、Obsidian で開き直すか手で直すかを確かめる（勝手に作り直さない）。直したら `node .kit/migrate.mjs` をもう一度実行する
- 古いフォルダに `data.json` 以外のファイルがある、または新旧の `data.json` の中身が違うときは、古いフォルダを残す。動きに影響しない（Obsidian は `community-plugins.json` にない ID を読み込まない）ので、消すかどうかはユーザーに確かめる

## 確かめ方（check.mjs）

- `community-plugins.json`・`appearance.json`・`hotkeys.json` に旧名が残っていない（ファイルがなければ通る）
- この端末に旧 ID の `data.json` があれば、新しい ID の `data.json` もある

## 取り込んだ後（人が行うこと）

- 各端末で Obsidian を開き直す（同期で受け取っただけの端末も）。開き直すまでは古いプラグインが動いたまま
- `data.json` は端末ごとで、移行はこの端末の分しか写せない。ほかの端末では、pkm-git と pkm-task が起動時に古い `data.json` を読んで引き継ぐ。端末名と、pkm-git の設定（リモート、トークンを指す SecretStorage の名前）が引き継がれていることを、設定画面で確かめる
- MCP を `VAULT_TASK_DEVICE` で設定しているなら、`PKM_TASK_DEVICE` に変える（しばらくは旧名も読む）
