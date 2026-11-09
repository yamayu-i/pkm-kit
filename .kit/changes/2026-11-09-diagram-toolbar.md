## 変更の要約

- 図の右上の操作バーを、Draw.io の図だけでなく、`asset/` の SVG の図（AI が書いたもの、D2 で描いたもの）とノートの Mermaid の図にも出すようにした（ADR-0102）。ボタンは「Copy」「Save PNG」「Expand」で、Draw.io の図だけ「Edit」も出る
- PNG（コピーと保存）は、ダークテーマで見ていても常にライトの色で、ライトの面の色を背景にする。Mermaid の図も PNG と SVG でコピーできる
- 「Save PNG」は、PC では保存のダイアログ、モバイルでは共有シートを開く。どちらも使えなければ `tmp/` に書く
- 「Expand」は図を全画面に出し、ホイール・ピンチで拡大・縮小、ドラッグで動かせる（全体を表示・100% のボタン、キー 0 / 1 / + / -）
- コマンド「Save a diagram in this note as PNG」「Expand a diagram in this note」と、ファイルエクスプローラーの SVG の右クリックの「Save as PNG」を足した
- 子への影響: 移行なし。各端末（PC とモバイル）で、Mermaid の図と SVG の図に操作バーが出ること、Save PNG で保存できること（モバイルは共有シートから画像を保存できるか）、Expand でピンチ・ドラッグができることを確かめる
