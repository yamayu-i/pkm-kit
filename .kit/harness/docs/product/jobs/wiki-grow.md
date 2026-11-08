# 知ったことを wiki に貯めて、後で引き出す

- 端末: AI 経由（取り込みと回答）、PC / スマホ（読む）
- 望む成果: [2](../strategy.md#望む成果)

## ジョブ

記事や資料、日々のメモで知ったことがあるとき、自分で整理しなくても知識として貯めたい。後で質問すれば、根拠付きで答えが返ってくるように。

## 今の流れ

1. AI に資料を渡して取り込んでもらう（wiki-ingest）。元資料は `sources/`、まとめは `wiki/` に入る
2. デイリーノートに書いたことは、AI が後で wiki に反映する（wiki-daily）。デイリーノートの本文は変えず、末尾にリンクだけを足す
3. 知りたいことを AI に聞く（wiki-query）。価値のある回答は wiki のページになる
4. 不便なことは `wiki/feedback.md` に書く
5. 取り込んだ資料は [Sources の一覧](../surfaces/template-lists.md) で、取り込み済みかが分かる

手順の詳細は子向けの [LLM wiki の仕組み](../../../../../.claude/docs/llm-wiki.md)。

## 関わる概念

[wiki](../concepts/wiki-page.md)、[デイリーノート](../concepts/note-daily.md)、[ノートの type](../concepts/note-type.md)

## うまくいっている兆し

- `wiki/log.md` の query が続いている（貯めたものが使われている）
- 未取り込みの元資料と、未処理のデイリーノートが溜まらない

## 知られている困りごと

まだない。
