## 変更の要約

- **移行 0058-pkm-plugin-names**: 自作プラグインの名前を `vault-*` から `pkm-*` にした（`pkm-git` / `pkm-task` / `pkm-template` / `pkm-ribbon` / `pkm-html`。表示名は `PKM Git` など。ADR-0058）。スニペットは `pkm-theme.css`、コマンド ID は `pkm-task:open-daily` など。移行は `community-plugins.json`・`appearance.json`・`hotkeys.json` を書き換え、この端末の `data.json` を新しいフォルダへ写す
- pkm-git と pkm-task は、自分の `data.json` がなければ旧 ID の `data.json` を読んで引き継ぐ（移行が届かないほかの端末のため）
- MCP サーバーの名前を `pkm-task-mcp`、端末名の環境変数を `PKM_TASK_DEVICE` にした（`VAULT_TASK_DEVICE` も読む）
- 移行 0002 と 0005 は、改名後の `pkm-ribbon` / `pkm-html` も「入っている」として扱う（記録を消して実行し直しても、古い名前を足し直さない）
- 子への影響: 移行 0058 を実行する。すべてのプラグインの `main.js`・`manifest.json`・`styles.css`、スニペット、`.kit/bin/` の CLI が新しいフォルダに移った。各端末で Obsidian を開き直し、端末名と pkm-git の設定が引き継がれていることを確かめる（モバイルも）
