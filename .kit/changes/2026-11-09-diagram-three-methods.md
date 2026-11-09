## 変更の要約

- **移行 0102-pkm-diagram**: 図のプラグインの ID を `pkm-drawio` から `pkm-diagram`（表示名 PKM Diagram）にする。`.obsidian/community-plugins.json`、`.obsidian/hotkeys.json` の `pkm-drawio:*`、`template/snippet/*.md` の `command: pkm-drawio:*` を書き換える（ADR-0102）
- Claude Code が描く図を、Mermaid（ノートのコードブロック）・D2（`asset/*.d2` から `asset/*.svg`）・SVG を直接書く（`asset/*.svg`）の 3 つから内容に合わせて選ぶようにした（スキル `diagram`。旧 `drawio-diagram`）。新しい図は Draw.io では作らない。既存の `.drawio.svg` はそのまま
- 図の色をデザイントークンに揃えた。Mermaid は `A:::blue` / `class A blue` で色が付く（スニペット `pkm-theme.css` が付ける。ライト・ダーク）。SVG と D2 は CLI が配色のスタイルを付ける
- CLI に `svg-style`（AI が書いた SVG に配色のスタイルと矢印を差し込む）・`svg-check`（安全性・色・ノートの幅での文字の大きさの検査）・`d2`（外部の d2 コマンドで、配色のテーマを付けて描く）を足した。`export` は `asset/` の普通の SVG の図も埋め込む
- CLI は `.kit/bin/diagram.mjs` になった。`.kit/bin/drawio.mjs` は旧名として残り、同じものを動かす
- 子への影響: 移行 0102 がある（`vault-upgrade` で実行する）。各端末で Obsidian を開き直し、設定のコミュニティプラグインに PKM Diagram が出ていて有効なこと、図の右上の操作バーと `/drawio` のスニペットが動くこと、ノートの Mermaid の図がライト・ダークとも配色どおりになることを確かめる。D2 の図を描くには、Claude Code を動かす環境に `d2` コマンドが要る
