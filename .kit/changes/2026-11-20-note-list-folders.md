## 変更の要約

- Notes の一覧に、タブ「Table」「Folders」を足した（[ADR-0213](../src/docs/adr/0213-note-list-folders.md)）。既定は今までどおりの表（Table）で、選んだタブは端末ごとに覚える
- Folders は `note/` を 1 本の木で見せる（Slides の一覧と同じ見た目）。フォルダを押すと開閉し、中のノートをタイトル・Tags・Created の行で並べる。並びは Created の新しい順か Title の順
- フォルダの「…」から New folder・Rename・Move to…・Delete（中にファイルがないフォルダだけ）、ノートの「…」から Open in new tab・Move to…。PC ではノートやフォルダをフォルダの行にドラッグして動かせる。リンクは Obsidian が書き換える
- `note/` の外にある `type: note` のノートは、木の最後の「Other locations」に出る。Move to… で `note/` の中へ動かせる

子への影響: 移行はない。スマホでタブの切り替えとフォルダの開閉、Move to… で動かせることを確かめる
