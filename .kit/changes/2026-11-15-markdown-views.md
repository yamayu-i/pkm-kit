# Reading View と Live Preview の改行・余白

- Reading View でも通常の改行を残すよう、必須設定の strictLineBreaks を false にした。移行 0167-markdown-line-breaks で既存 Vault の設定を更新する。issue を含むすべてのノートに適用し、本文は書き換えない。取り込み後は Obsidian を再起動する。
- H2 の上余白とリストの行間を両モードに適用し、深さ 7〜9 のリストの記号もそろえた。
- 編集中の記号・連続空行・リスト補助線など、モードの構造による差は残る。`.kit/src/docs/markdown-views.md` に一覧と確認方法を記載した。
