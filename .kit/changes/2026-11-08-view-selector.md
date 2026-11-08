## 変更の要約

- **移行 0072-pkm-view-selector**: `.obsidian/community-plugins.json` に新しいプラグイン `pkm-view-selector` を足し、`.obsidian/hotkeys.json` の `editor:insert-link` を `[]` にする（子が割り当てていても上書きする）
- 新しいプラグイン pkm-view-selector（ADR-0072）。コマンド「View を探して開く」（既定のホットキー Mod+K）で、pkm-task・pkm-template・pkm-updates の一覧の View を 1 つのダイアログから探して開く。候補は実行時にコマンドから集めるので、片方のプラグインが無効ならその分は出ない。検索は大文字と小文字を区別しない。開いている View には印が付く
- 「Markdown リンクを挿入」のホットキー（Obsidian の既定の Mod+K）がなくなる。コマンドパレットからは使える
- pkm-task・pkm-template・pkm-updates の View を開くコマンドに、View のアイコンが付いた
- 子への影響: 移行 0072 がある（`vault-upgrade` で実行する）。各端末で Obsidian を開き直し、Mod+K でダイアログが開くこと、ノートの編集中に Mod+K でリンクが挿入されないことを確かめる。スマホではコマンドパレットから呼ぶ
