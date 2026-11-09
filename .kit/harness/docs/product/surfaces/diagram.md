# 図（SVG・Mermaid）

- 種類: 画面（図に浮かべる操作バー・拡大表示・縮めすぎの印）・コマンド
- 開き方: ノートの図（`asset/` の SVG の画像と、Mermaid の図）にマウスを載せる（タッチでは押す）。コマンド「Copy a diagram in this note」「Save a diagram in this note as PNG」「Expand a diagram in this note」「Export this note to tmp/ (embed diagrams)」。ファイルエクスプローラーの `.svg` の右クリック
- 場面: [ノートを書く](../jobs/note-write.md)

## 今の振る舞い

- 図は Claude Code が内容に合わせて 3 つの方式で作る（スキル diagram、ADR-0102）: Mermaid（ノートのコードブロック）、D2（`asset/*.d2` から `asset/*.svg` を描く）、SVG を直接書く（`asset/*.svg`）。色はデザイントークンから作った配色（ライト・ダーク）で、Mermaid はスニペット `pkm-theme.css` が、SVG と D2 は CLI（`node .kit/bin/diagram.mjs` の `svg-style` / `d2`）が付ける。CLI は描いた SVG の安全性・色・ノートの幅での文字の大きさも検査する
- SVG の図は `![説明](asset/<名前>.svg)` で参照する。表示は Obsidian の普通の画像の表示（プラグインを無効にしても見える）
- 以前の Draw.io の図（`asset/*.drawio.svg`）も、普通の SVG の図として同じように扱う。編集する手段はない（直すなら 3 方式で描き直す。ADR-0111）
- 図にマウスを載せると、右上に「Copy」「Save PNG」「Expand」が出る（Reading view と Live Preview の両方）。タッチでは図を押すと出て、ほかの場所を押すと消える。対象は Vault の SVG の図と、ノートの Mermaid の図。PNG・JPEG などの普通の画像には出ない
- 「Copy」は PNG / SVG を選ぶ。SVG は、以前の Draw.io の図なら編集用 XML を除いたもの。画像として書けない環境ではテキストとしてコピーし、そう知らせる
- PNG（コピーと保存）は、ノートをダークテーマで見ていても常にライトの色で、ライトの面の色を背景にする（貼り付け先の多くは白い背景）。2 倍の大きさ
- 「Save PNG」は、PC では保存のダイアログ、モバイルでは共有シート（画像を保存・ファイルに保存など）を開く。どちらも使えなければ `tmp/<図の名前>.png` に書いて知らせる
- ノートの中で縮めて出した図のいちばん小さい文字が 9px 未満になると、図の右下に「Expand to read」の印が出る（ペインを広げて読める大きさになれば消える）。印は押せない飾りで、拡大は操作バーの「Expand」で行う
- 「Expand」は全画面に図を出す。ホイール・ピンチで拡大・縮小し、ドラッグで動かす。ボタンで縮小・拡大・全体を表示・100%。キーは 0（全体）・1（100%）・+ / -。ダブルクリックで 2 倍。画面の大きさが変わると全体を表示し直す
- 「このノートを tmp/ に書き出す」は、md / html の `asset/` の SVG の図の参照を、SVG の data URI に置き換えて `tmp/<ファイル名>` に書く（あれば番号を付けた別名。以前の Draw.io の図は編集用 XML を除く）。元のノートと図は変えない。見つからない図・壊れた図があれば何も書かない。コードブロックの中の例は変えない。Mermaid はコードブロックのまま残る
- 同期（PKM Git）で両側が変えた SVG の図は行単位で混ぜず、リモート版と `<名前> (conflict <端末> <日時>).svg` を残す

## 使う概念

なし（図はノートではない。frontmatter も type も持たない）

## 根拠

[ADR-0102](../../../../src/docs/adr/0102-diagram-three-methods.md)、[ADR-0111](../../../../src/docs/adr/0111-remove-drawio.md)
