# 0137: task board のグループを廃止する

## 何が変わったか

`.kit/src/docs/adr/0137-board-lanes-and-sub-issue-cards.md`。

- task board のグループ・サブグループ（`issue/board-groups.json`、routine の `group`、Board groups の画面）を廃止した。カードを分ける手間の割に、時刻・順番・状態のどれとも結びついていなかったため
- ボードは 1 列になり、status とタイマーから自動で欄（Working / Top 3 / Up next / Waiting / Done）に分かれる。★（今日の最重要、3 件まで）と並びは手で付ける
- ボードにサブイシューのカード（1 件ずつ）が載る
- pkm-task は `issue/board-groups.json` を読まない。routine に `group` が残っていると、lint と pkm-task が `legacy-routine-group` の警告を出す

## スクリプトが行うこと（migrate.mjs）

- `issue/board-groups.json` を消す
- `routine/*.md` と、子が重ねた `template/file/routine.md` の frontmatter から、`group` の行だけを消す。ほかの行・本文・行末（CRLF も）は変えない
- board の jsonl（以前の `place` と、`group` 付きの `order`）は書き換えない（追記だけの記録のため）。pkm-task は読んで捨てる。グループの中で並べた順は引き継がない
- `node .kit/migrate.mjs --dry-run` で、消すファイルと行を一覧にする

## スクリプトで扱えない場合（AI が行うこと）

- **group が 1 行の値ではない**（入れ子、`|` などの複数行の値）: 消してよいかをユーザーに確かめ、`group` とその続きの行を消す。直したら `node .kit/migrate.mjs` をもう一度実行する
- 子だけのスキル（`skills/local-*`）、`local/CLAUDE.md`、ノートの本文でグループに触れていれば、欄（Working / Top 3 / Up next / Waiting / Done）と ★ に合わせて直すかをユーザーに確かめる（スクリプトは本文を変えない）

## 確かめ方（check.mjs）

- `issue/board-groups.json` がない
- `routine/*.md` と `template/file/routine.md` の frontmatter に `group` が残っていない

あわせて `node .kit/bin/lint.mjs .` で、`legacy-routine-group` が出ないことを確かめる。

## 取り込んだ後（人が行うこと）

グループでカードを分けていたなら、その分けは失われる。朝にボードを開いたら、今日の最重要のカードを 3 件まで Top 3 に入れ（ドラッグか、カードの `···` の `Add to Top 3`）、Up next を並べ替える。並びは翌日以降にも引き継ぐ。

この移行は `issue/board-groups.json` を消す。取り込む前にすべての端末で同期を済ませる（古い端末が書き戻すと、ファイルが戻る。戻ったときは `node .kit/migrate.mjs` をもう一度実行する）。
