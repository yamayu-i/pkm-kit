# 0072: 一覧の View を探すダイアログ pkm-view-selector を有効にし、Mod+K を空ける

## 何が変わったか

`.kit/src/docs/adr/0072-view-selector.md`。

- 新しいプラグイン pkm-view-selector。コマンド「View を探して開く」（既定のホットキー Mod+K）で、pkm-task と pkm-template の一覧の View（Daily, Issues, Inbox, …, Daily notes, Notes, Sources）を 1 つのダイアログから探して開く。検索は大文字と小文字を区別しない
- Obsidian の既定で Mod+K に割り当てられている「Markdown リンクを挿入」（`editor:insert-link`）のホットキーを外す。コマンドパレットからは引き続き使える
- 上流が子に求める Obsidian の設定（`.kit/obsidian-required.json`）に、`community-plugins.json` の `pkm-view-selector` と、`hotkeys.json` の `"editor:insert-link": []` が増えた

## スクリプトが行うこと（migrate.mjs）

- `.obsidian/community-plugins.json` に `pkm-view-selector` を足す。ほかの要素と順は残す
- `.obsidian/hotkeys.json` の `editor:insert-link` を `[]` にする。子が自分で割り当てていても上書きする（ADR-0072）。ほかのキーは残す。ファイルがなければ作る

JSON は Obsidian と同じく、2 つの空白で字下げし、末尾に改行を付けない。

## スクリプトで扱えない場合（AI が行うこと）

- `community-plugins.json` か `hotkeys.json` が JSON として読めない、または `hotkeys.json` がオブジェクトでない: Obsidian が書きかけたか、人が編集中に壊した可能性が高い。直し方をユーザーに確かめる（勝手に作り直さない）

## 確かめ方（check.mjs）

- `community-plugins.json` に `pkm-view-selector` が入っている
- `hotkeys.json` の `editor:insert-link` が `[]`

## 取り込んだ後（人が行うこと）

Obsidian を開き直すと、pkm-view-selector が読み込まれる。PC で Mod+K を押してダイアログが開くこと（ノートの編集中でも、リンクが挿入されないこと）、`issues` と打って Issues が出て Enter で開くことを確かめる。スマホではコマンドパレットから「View を探して開く」を呼ぶ。
