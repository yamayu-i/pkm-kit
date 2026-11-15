# ボードの欄と ★

## 目的

その日のボードを、今の状態と大事さで自然に分け、次にどれに手を付けるかを迷わずに決める。

## 状態

欄は保存しない。status・タイマー・★ から決まる: Working（タイマーが動いているもの）→ Done（closed / canceled / someday、結果のある routine、持ち越したもの）→ Waiting（waiting / delegated）→ Top 3（★ を付けたもの。3 件まで）→ Up next（残り）。★ はその日だけの記録、並びは翌日以降にも引き継ぐ記録で、どちらもボードの操作ログ（`star`、`order`）に残る。

## 操作

★ を付ける・外す（カードのメニュー、Top 3 へのドラッグ）、並べ替える（Top 3 と Up next のドラッグ、Move up / Move down）、タイマーを動かす（Working に移る）。

## 使い方の筋道

朝、今日の最重要を 3 件まで Top 3 に入れ、Up next を並べる。手を付けるとタイマーで Working に移り、止めると元の欄に戻る。AI や人に任せて待つものは waiting / delegated にして Waiting に出す。同じ issue のサブが隣り合うと、親の見出しの下にまとまる。

## 根拠

[ADR-0137](../../../../src/docs/adr/0137-board-lanes-and-sub-issue-cards.md)、[ADR-0114](../../../../src/docs/adr/0114-board-manual-order.md)
