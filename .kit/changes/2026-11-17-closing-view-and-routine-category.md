## 変更の要約

- ボードの「Not done」の欄（未完了の一覧と持ち越しの操作）をやめ、ボードの末尾に「Close board」を置いた（ADR-0206）。押すと Today の中の Closing の画面に移り、右のペインに今日のデイリーノートを開いて、本文の冒頭に振り返りの型を 1 回だけ入れる
- Closing の画面: その日の closing の routine、タスク（Closed / Not done / Waiting / Canceled の群）、その日に作った・変えたノートを、1 行ずつの一覧で出す。記録（`## Task board` 節）は末尾の「Finish closing」で書く。「← Board」でボードに戻る
- 振り返りの型はスニペット `daily-review.md`。上流の既定は `.kit/templates/snippet/daily-review.md`。その Vault の型にしたいときは `template/snippet/daily-review.md` を置く（`/dr` でも挿入できる）
- routine に `category`（`closing` か、なし = default）と `order` を足した。Routines の一覧は category ごとの群になり、ドラッグか `···` のメニューで順番と category を変えられる。ボードの Routines の欄には default だけを、この順で出す。routine 画面で category を選べる
- ボードの routine のカードに status のボタン（closed にする / ↩ で戻す）を出した
- 予定日に結果を付けなかった routine を、積み残しとして Today の Calendar の Missed（Routines の節。予定日ごとに 1 行）に出し続ける。Close / Cancel で、もとの日の結果を書く。2026-11-18 より前の日は数えない。MCP の `get_overview` に `missedRoutines` と `missedRoutineCount` を足した
- 子への影響: 移行は要らない（`category` と `order` は任意。既存の routine は default のまま ID の順で動く）。PC とモバイルで、Close board を押して Closing の画面とデイリーノートが並ぶこと、型が冒頭に 1 回だけ入ること、Routines の一覧のドラッグと `···` のメニューで並べ替えられること、routine の積み残しが Missed に出ることを確かめる
