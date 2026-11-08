## 変更の要約

- pkm-html に、HTML をそれだけで開ける 1 ファイルにして `tmp/` に書き出すコマンド「Export HTML to tmp/」と、`.html` のファイルのメニューの項目を足した（ADR-0044）。デザイントークンの値（ライト / ダークは OS の設定に追従）、Vault の中の画像、図（編集用 XML を除いたもの）を埋め込み、スクリプトと外部の読み込みを除く。同じ名前があれば番号を付けた別名にする
- PC の Claude Code 用に CLI `node .kit/bin/html.mjs export <ファイル.html>` を足した。`tmp/` に HTML の成果物を作るときは、これを通す（`.claude/docs/vault-conventions.md`）
- 子への影響: 移行なし。Obsidian で HTML を開き、コマンドかファイルのメニューから書き出し、`tmp/` の HTML を OS のブラウザで開いて、色・画像・ライト / ダークの切り替えを確かめる（スマホでも書き出せること）
