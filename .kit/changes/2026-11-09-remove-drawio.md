## 変更の要約

- Draw.io 関連をすべて除いた（ADR-0111）。pkm-diagram の Draw.io の編集画面、コマンド「New diagram」「Edit a diagram in this note」、操作バーとファイルのメニューの「Edit」、XML のコピー、`/drawio` のスニペット、CLI の `build` / `render` / `inspect` / `extract` / `strip`、旧名の `.kit/bin/drawio.mjs`、スキルと規約の記述
- 以前の Draw.io の図（`asset/*.drawio.svg`）はそのまま残る。普通の SVG の図として表示・コピー・PNG で保存・拡大できる。コピーと tmp/ への書き出しでは、中の編集用 XML を除く。直すなら Claude Code に頼んで Mermaid / D2 / SVG で描き直す
- 同期（PKM Git と `.gitattributes`）で行単位でマージしない扱いを、`.drawio.svg` から `.svg` 全体に広げた。両側が SVG の図を変えたら、リモート版と `<名前> (conflict …).svg` を残す
- pkm-diagram はネットワークを使わなくなった（外部の origin を読む iframe がない）
- 子への影響: 移行なし。`template/snippet/` に `command: pkm-diagram:create-diagram` などのスニペットを置いていたら、選んでも実行できないので消す。ノートや `local/` の手順に `.kit/bin/drawio.mjs` を書いていたら `.kit/bin/diagram.mjs` にする（Draw.io 用の `build` などのコマンドはもうない）
