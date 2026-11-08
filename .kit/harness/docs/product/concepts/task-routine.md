# routine

## 目的

決まった間隔でくり返すやることを、毎回作らずにその日のボードに出す。

## 状態

`routine/r-N.md`: `summary`、`repeat`（every / interval / on）、`start`、`end`、`active`、`group`、`priority`、[label](task-label.md)、[estimated](task-estimate.md)。その日の結果（closed / canceled）はボードの操作ログにあり、routine のノートには書かない。

## 操作

作る・一時停止する（Routines）、くり返しを変える（routine 画面）、その日の結果を決める（ボード）、タイマーを動かす。

## 使い方の筋道

くり返しに当てはまる日には、自動でボードに載る。その日のうちに closed か canceled にし、翌日に持ち越さない。status、Do Date、期限は持たない。

## 根拠

[ADR-0010](../../../../src/docs/adr/0010-routine.md)、[ADR-0018](../../../../src/docs/adr/0018-list-edit-routine-screen.md)、[ADR-0021](../../../../src/docs/adr/0021-routine-effort-and-sidebar.md)
