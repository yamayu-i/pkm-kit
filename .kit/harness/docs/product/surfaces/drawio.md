# Draw.io の図

- 種類: 画面（図に浮かべる操作バー・編集画面）・コマンド
- 開き方: ノートの図（`asset/*.drawio.svg`）にマウスを載せる（タッチでは押す）。コマンド「New diagram」「Edit a diagram in this note」「Copy a diagram in this note」「Export this note to tmp/ (embed diagrams)」。ファイルエクスプローラーの `.drawio.svg` の右クリック
- 場面: [ノートを書く](../jobs/note-write.md)

## 今の振る舞い

- 図は `asset/<名前>.drawio.svg` に置き、`![説明](asset/<名前>.drawio.svg)` で参照する。表示は Obsidian の普通の画像の表示（プラグインを無効にしても見える）。1 ファイルに描画と編集用 XML（全ページ）を持つ。Draw.io 単体でも開ける
- 図の画像にマウスを載せると、右上に「コピー」「編集」が出る（Reading view と Live Preview の両方）。タッチでは画像を押すと出て、ほかの場所を押すと消える。普通の画像には出ない
- 「コピー」は PNG / SVG / XML を選ぶ。SVG は編集用 XML を除いたもの。画像として書けない環境ではテキストとしてコピーし、そう知らせる。XML は Draw.io に貼れば編集できる形（全ページ）
- 「編集」は Obsidian の中に Draw.io（embed.diagrams.net）を開く。ネットワークが要る。保存すると `.drawio.svg` 全体を書き換える。編集中にファイルが変わっていたら（同期など）、上書きせずに「自分の版を別名で保存」「上書きする」「編集に戻る」を選ぶ。保存していない変更があるまま閉じると、確かめる（XML をコピーして閉じることもできる）
- 「New diagram」は名前を聞いて Draw.io を開き、最初の保存で `asset/<名前>.drawio.svg` を作り、開いていたノートのカーソルの位置に参照を入れる
- 「このノートを tmp/ に書き出す」は、md / html の図の参照を、編集用 XML を除いた SVG の data URI に置き換えて `tmp/<ファイル名>` に書く（あれば番号を付けた別名）。元のノートと図は変えない。見つからない図・壊れた図があれば何も書かない。コードブロックの中の例は変えない。data URI の画像を出せるかは、渡した先の表示による
- 編集用 XML のない SVG（`.drawio.svg` という名前の普通の SVG）は、表示とコピー（PNG / SVG）はできるが、編集と XML のコピーはできない（そう知らせる）
- Claude Code は新しい図を Draw.io では作らず、内容に合わせて Mermaid（ノートのコードブロック）・D2（`asset/*.d2` から `asset/*.svg` を描く）・SVG を直接書く（`asset/*.svg`）の 3 つから選ぶ（スキル diagram、ADR-0102）。色はデザイントークンから作った配色（ライト・ダーク）で、Mermaid はスニペット `pkm-theme.css` が、SVG と D2 は CLI（`node .kit/bin/diagram.mjs` の `svg-style` / `d2`）が付ける。CLI は描いた SVG の安全性・色・ノートの幅での文字の大きさも検査する
- 既存の Draw.io の図は、Claude Code が CLI の `render` / `inspect` で直す・読み取る。描画は自前で、Draw.io と細部が違うことがある。pkm-diagram で開いて保存すると Draw.io の描画になる
- 「このノートを tmp/ に書き出す」は、`asset/` の普通の SVG の図（AI が書いたもの、D2 で描いたもの）も data URI にして埋め込む
- 同期（PKM Git）で両側が変えた図は行単位で混ぜず、リモート版と `<名前> (conflict <端末> <日時>).drawio.svg` を残す

## 使う概念

なし（図はノートではない。frontmatter も type も持たない）

## 根拠

[ADR-0064](../../../../src/docs/adr/0064-drawio-diagrams.md)、[ADR-0085](../../../../src/docs/adr/0085-drawio-cli-build-render.md)、[ADR-0102](../../../../src/docs/adr/0102-diagram-three-methods.md)
