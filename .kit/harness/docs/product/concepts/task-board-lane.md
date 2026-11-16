# ボードの欄と ★

## 目的

その日のボードを、今の状態と大事さで自然に分け、次にどれに手を付けるかを迷わずに決める。

## 状態

欄は保存しない。status・タイマー・★ から決まる: Routines（routine は常にここ。issue・サブと混ぜない）→ Working（タイマーが動いている issue・サブ）→ Done（closed / canceled / someday、持ち越したもの）→ Watch（waiting / delegated。ボードに載っていないものも含めて全部）→ Top 4（★ を付けたもの。4 件まで）→ Up next（残り）。★ はその日だけの記録、並びは翌日以降にも引き継ぐ記録で、どちらもボードの操作ログ（`star`、`order`）に残る。

## 操作

★ を付ける・外す（カードのメニュー、Top 4 へのドラッグ）、並べ替える（Top 4 と Up next のドラッグ、Move up / Move down）、タイマーを動かす（Working に移る）。

## 使い方の筋道

朝、今日の最重要を 4 件まで Top 4 に入れ、Up next を並べる。手を付けるとタイマーで Working に移り、止めると元の欄に戻る。AI や人に任せて待つものは waiting / delegated にして Watch に出す（★ は外れ、未完了に数えない）。返ってきたら Resume で in-progress に戻して今日のボードに載せる。同じ issue のサブが隣り合うと、親の見出しの下にまとまる。

## 根拠

[ADR-0137](../../../../src/docs/adr/0137-board-lanes-and-sub-issue-cards.md)、[ADR-0114](../../../../src/docs/adr/0114-board-manual-order.md)、[ADR-0184](../../../../src/docs/adr/0184-pick-in-progress-and-watch-lane.md)
