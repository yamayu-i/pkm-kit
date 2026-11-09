## 変更の要約

- **移行 0102-pkm-diagram**: 図のプラグインの ID を `pkm-drawio` から `pkm-diagram`（表示名 PKM Diagram）にする。`.obsidian/community-plugins.json`、`.obsidian/hotkeys.json` の `pkm-drawio:*`、`template/snippet/*.md` の `command: pkm-drawio:*` を書き換える（ADR-0102）
- CLI は `.kit/bin/diagram.mjs` になった。`.kit/bin/drawio.mjs` は旧名として残り、同じものを動かす
- 子への影響: 移行 0102 がある（`vault-upgrade` で実行する）。各端末で Obsidian を開き直し、設定のコミュニティプラグインに PKM Diagram が出ていて有効なこと、図の右上の操作バーと `/drawio` のスニペットが動くことを確かめる
